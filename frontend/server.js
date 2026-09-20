const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const backend = 'http://localhost:8080';
const codeforcesCache = new Map();
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const sendJson = (response, status, body) => {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(body));
};

const dayKey = (date) => date.toISOString().slice(0, 10);
const weeklyActivity = (counts) => {
  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const dateKey = dayKey(date);
    days.push({
      date: dateKey,
      day: date.toLocaleDateString('en-US', {weekday: 'short', timeZone: 'UTC'}),
      commits: counts[dateKey] || 0
    });
  }
  return days;
};
const currentStreak = (dates) => {
  const days = new Set(dates);
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};
const getJson = async (url, options = {}) => {
  const upstream = await fetch(url, options);
  if (!upstream.ok) throw new Error(`Provider returned ${upstream.status}`);
  return upstream.json();
};
const getText = async (url, options = {}) => {
  const upstream = await fetch(url, options);
  if (!upstream.ok) throw new Error(`Provider returned ${upstream.status}`);
  return upstream.text();
};

const proxyProfileStats = async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const match = pathname.match(/^\/api\/student\/public\/profile-stats\/(github|leetcode|codeforces)\/([A-Za-z0-9_.-]{1,100})$/);
  if (!match) return false;
  const [, provider, username] = match;
  try {
    let upstream;
    let options = {};
    if (provider === 'github') {
      const headers = {'User-Agent': 'Code2Career/1.0'};
      let profile = {};
      let profileError = false;
      try {
        profile = await getJson(`https://api.github.com/users/${encodeURIComponent(username)}`, {headers});
      } catch {
        profileError = true;
      }
      let events = [];
      try {
        events = await getJson(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`, {headers});
      } catch {
        events = [];
      }
      const activityDates = events.flatMap((event) => event.type === 'PushEvent'
        ? [event.created_at, ...(event.payload?.commits || []).map(() => event.created_at)]
        : []).map((date) => dayKey(new Date(date)));
      const activityCounts = {};
      activityDates.forEach((date) => { activityCounts[date] = (activityCounts[date] || 0) + 1; });
      if (profileError || !events.length) {
        try {
          const calendar = await getText(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {headers});
          for (const match of calendar.matchAll(/data-date="([^"]+)"[^>]*data-(?:count|level)="(\d+)"/g)) {
            activityCounts[match[1]] = Number(match[2]);
          }
        } catch {
          // The response below reports the unavailable state when both public sources fail.
        }
      }
      const hasActivity = Object.keys(activityCounts).length > 0;
      sendJson(response, 200, {
        provider,
        repositories: Number(profile.public_repos) || 0,
        followers: Number(profile.followers) || 0,
        streak: currentStreak(activityDates),
        weeklyActivity: weeklyActivity(activityCounts),
        live: hasActivity,
        message: hasActivity ? 'Live GitHub contribution calendar' : profileError ? 'GitHub activity is temporarily unavailable.' : 'No recent public GitHub activity.'
      });
      return true;
    } else if (provider === 'codeforces') {
      const [profileResponse, submissions] = await Promise.all([
        getJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`),
        getJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`)
      ]);
      const profile = profileResponse.status === 'OK' && profileResponse.result?.[0];
      if (!profile || submissions.status !== 'OK') throw new Error('Profile was not found');
      const accepted = submissions.result.filter((item) => item.verdict === 'OK');
      const uniqueProblems = new Set(accepted.map((item) => `${item.problem?.contestId}:${item.problem?.index}`));
      const activityDates = accepted.map((item) => dayKey(new Date(item.creationTimeSeconds * 1000)));
      const activityCounts = {};
      submissions.result.forEach((item) => {
        const date = dayKey(new Date(item.creationTimeSeconds * 1000));
        activityCounts[date] = (activityCounts[date] || 0) + 1;
      });
      const stats = {
        provider,
        rating: profile.rating || 'Unrated',
        maxRating: profile.maxRating || 'Unrated',
        solved: uniqueProblems.size,
        streak: currentStreak(activityDates),
        weeklyActivity: weeklyActivity(activityCounts)
      };
      const cached = codeforcesCache.get(username);
      if (stats.solved === 0 && cached && cached.solved > 0) {
        sendJson(response, 200, cached);
      } else {
        codeforcesCache.set(username, stats);
        sendJson(response, 200, stats);
      }
      return true;
    } else {
      upstream = 'https://leetcode.com/graphql';
      options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'User-Agent': 'Code2Career/1.0'},
        body: JSON.stringify({
          query: 'query userPublicProfile($username: String!) { matchedUser(username: $username) { submitStatsGlobal { acSubmissionNum { difficulty count } } userCalendar { streak totalActiveDays submissionCalendar } } }',
          variables: {username}
        })
      };
    }
    const data = await getJson(upstream, options);
    if (provider === 'leetcode') {
      const user = data.data?.matchedUser;
      const stats = user?.submitStatsGlobal?.acSubmissionNum;
      const solved = stats?.find((item) => item.difficulty === 'All')?.count;
      if (solved === undefined) throw new Error('Profile was not found');
      const byDifficulty = Object.fromEntries(stats
        .filter((item) => item.difficulty !== 'All')
        .map((item) => [item.difficulty.toLowerCase(), item.count]));
      const calendar = JSON.parse(user.userCalendar?.submissionCalendar || '{}');
      const calculatedStreak = currentStreak(Object.entries(calendar)
        .filter(([, count]) => count > 0)
        .map(([timestamp]) => dayKey(new Date(Number(timestamp) * 1000))));
      const activityCounts = Object.fromEntries(Object.entries(calendar)
        .map(([timestamp, count]) => [dayKey(new Date(Number(timestamp) * 1000)), count]));
      sendJson(response, 200, {
        provider,
        solved,
        easy: byDifficulty.easy || 0,
        medium: byDifficulty.medium || 0,
        hard: byDifficulty.hard || 0,
        streak: Number(user.userCalendar?.streak) || calculatedStreak,
        totalActiveDays: Number(user.userCalendar?.totalActiveDays) || 0,
        weeklyActivity: weeklyActivity(activityCounts)
      });
    }
  } catch (error) {
    sendJson(response, 502, {error: `${provider} live sync failed`});
  }
  return true;
};

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' || request.method === 'POST') {
    if (await proxyProfileStats(request, response)) return;
  }
  if (request.url.startsWith('/api/')) {
    const proxy = http.request(`${backend}${request.url}`, {
      method: request.method,
      headers: request.headers
    }, (upstream) => {
      response.writeHead(upstream.statusCode, upstream.headers);
      upstream.pipe(response);
    });
    proxy.on('error', () => {
      response.writeHead(502, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({error: 'Backend unavailable'}));
    });
    request.pipe(proxy);
    return;
  }

  const requested = request.url.split('?')[0];
  const file = path.join(root, requested === '/' ? 'index.html' : requested);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(file).pipe(response);
});

server.listen(5173, 'localhost', () => {
  console.log('Code2Career frontend running at http://localhost:5173');
});
