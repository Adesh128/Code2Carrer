const API = '';
const $ = (id) => document.getElementById(id);
const token = () => localStorage.getItem('careeros_token');
const dialog = (title, message, action = 'Got it') => {
  $('dialog-title').textContent = title;
  $('dialog-message').textContent = message;
  $('dialog-action').textContent = action;
  $('dialog-search').classList.add('hidden');
  $('resume-upload').classList.add('hidden');
  $('job-filters').classList.add('hidden');
  $('dialog-results').innerHTML = '';
  $('dialog-results').classList.add('hidden');
  $('action-dialog').classList.remove('hidden');
};
const renderJobsPageRecommendations = () => {
  const jobs = resumeAnalysis ? filteredRecommendations($('page-job-location-filter').value, $('page-job-mode-filter').value, $('page-job-paid-filter').value) : [];
  $('jobs-page-list').innerHTML = jobs.length ? jobs.map((job) => `<div class="job"><div class="company-logo">${job.company[0]}</div><div class="job-info"><strong>${job.title}</strong><small>Resume skills: ${job.matchedSkills.join(', ')} · ${job.mode === 'remote' ? 'Work from home' : 'On-site'} · ${job.paid ? 'Paid' : 'Compensation varies'}</small><a class="job-source" href="${job.url}" target="_blank" rel="noopener noreferrer">Open live ${job.source} results ↗</a></div></div>`).join('') : '<p class="muted">Upload and submit a resume with matching technical skills to receive recommendations.</p>';
};
const closeDialog = () => $('action-dialog').classList.add('hidden');
const overviewSections = document.querySelectorAll('.content > section:not(#skills-view):not(#jobs-view)');
const skillsView = document.getElementById('skills-view');
const skillsNav = document.getElementById('skills-nav');
const jobsView = document.getElementById('jobs-view');
const jobsNav = document.getElementById('jobs-nav');
const applicationsView = document.getElementById('applications-view');
const applicationsNav = document.getElementById('applications-nav');
const showSkills = () => {
  overviewSections.forEach((section) => section.classList.add('hidden'));
  skillsView.classList.remove('hidden');
  jobsView.classList.add('hidden');
  applicationsView.classList.add('hidden');
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  skillsNav.classList.add('active');
};
const showJobs = () => {
  overviewSections.forEach((section) => section.classList.add('hidden'));
  skillsView.classList.add('hidden');
  applicationsView.classList.add('hidden');
  jobsView.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  jobsNav.classList.add('active');
  renderJobsPageRecommendations();
};
const readApplications = () => {
  try { const value = JSON.parse(localStorage.getItem('code2career_applications') || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
};
const renderApplications = () => {
  const applications = readApplications();
  $('application-total').textContent = applications.length;
  $('application-active').textContent = applications.filter((item) => !['Rejected', 'Offer'].includes(item.status)).length;
  $('application-interviews').textContent = applications.filter((item) => item.status === 'Interview').length;
  $('application-offers').textContent = applications.filter((item) => item.status === 'Offer').length;
  $('application-list').innerHTML = applications.length ? applications.map((item) => `<div class="application-row"><div><strong>${item.role}</strong><small>${item.company}</small></div><span class="application-status">${item.status}</span><span>${item.deadline || 'No deadline'}</span><span>${item.note || 'No next step added'}</span><small>Added ${item.created}</small><button class="application-delete" data-application-id="${item.id}" type="button">Remove</button></div>`).join('') : '<p class="muted">No applications yet. Add your first job or internship above.</p>';
};
const showApplications = () => {
  overviewSections.forEach((section) => section.classList.add('hidden'));
  skillsView.classList.add('hidden');
  jobsView.classList.add('hidden');
  applicationsView.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  applicationsNav.classList.add('active');
  renderApplications();
};
const showOverview = () => {
  overviewSections.forEach((section) => section.classList.remove('hidden'));
  skillsView.classList.add('hidden');
  jobsView.classList.add('hidden');
  applicationsView.classList.add('hidden');
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelector('.nav-item').classList.add('active');
};
const request = async (path, options = {}) => {
  const headers = {'Content-Type': 'application/json', ...(options.headers || {})};
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API}${path}`, {...options, headers});
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
};
const render = (data) => {
  $('profile').textContent = `${data.profileCompletion}%`;
  $('ats').textContent = data.resumeAtsScore;
  $('applications').textContent = data.career.applications;
  $('streak').textContent = `${data.coding.currentStreak} days`;
  $('activity-chart').innerHTML = data.weeklyCodingActivity.map((item) => `<div class="bar-group"><div class="bar" style="height:${item.commits * 5}px"></div><small>${item.day}</small></div>`).join('');
  if ($('jobs')) renderDashboardRecommendations(data.recommendedJobs);
  if ($('goals')) $('goals').innerHTML = data.dailyGoals.map((goal) => `<div class="goal ${goal.progress === 100 ? 'done' : ''}"><span class="check"></span><div class="goal-info"><strong>${goal.title}</strong><small>${goal.status} · ${goal.progress}% complete</small></div></div>`).join('');
};
let activityFilter = 'all';
let liveCodingStats = {};
const updateCurrentStreak = (stats) => {
  const streaks = Object.values(stats || {})
    .map((profile) => Number(profile?.streak) || 0)
    .filter((streak) => streak > 0);
  if (streaks.length) $('streak').textContent = `${Math.max(...streaks)} days`;
};
const renderLiveCodingActivity = (stats = liveCodingStats) => {
  liveCodingStats = stats;
  const selectedSources = activityFilter === 'all' ? ['leetcode', 'codeforces'] : [activityFilter];
  const sources = selectedSources.map((name) => stats[name]).filter((profile) => profile?.weeklyActivity);
  if (!sources.length) return;
  const totals = sources[0].weeklyActivity.map((item, index) => ({
    day: item.day,
    commits: sources.reduce((sum, profile) => sum + (profile.weeklyActivity[index]?.commits || 0), 0)
  }));
  jobsNav.addEventListener('click', showJobs);
  applicationsNav.addEventListener('click', showApplications);
  $('activity-chart').innerHTML = totals.map((item) => `<div class="bar-group"><div class="bar" style="height:${Math.max(item.commits * 5, item.commits ? 8 : 2)}px"></div><small>${item.day}</small></div>`).join('');
};
const renderCodingHeatmap = (stats = {}) => {
  const providers = [['github', 'GitHub'], ['leetcode', 'LeetCode'], ['codeforces', 'Codeforces']];
  const selected = window.heatmapFilter || 'all';
  const source = providers.filter(([key]) => selected === 'all' || selected === key).map(([key, label]) => ({key, label, days: stats[key]?.weeklyActivity || []}));
  const days = source.find((item) => item.days.length)?.days || [];
  if (!days.length) {
    $('coding-heatmap').innerHTML = '<p class="muted">Connect your profiles to load activity.</p>';
    return;
  }
  const max = Math.max(1, ...source.flatMap((item) => item.days.map((day) => Number(day.commits) || 0)));
  $('coding-heatmap').innerHTML = `<div></div>${days.map((day) => `<div class="heatmap-day">${day.day}</div>`).join('')}${source.map((item) => `<div class="heatmap-label">${item.label}</div>${days.map((day, index) => { const value = Number(item.days[index]?.commits) || 0; const level = value === 0 ? 0 : value >= max * .67 ? 3 : value >= max * .34 ? 2 : 1; return `<div class="heat-cell heat-${level}" title="${item.label}: ${value} activity on ${day.day}"></div>`; }).join('')}`).join('')}`;
};
window.heatmapFilter = 'all';
document.querySelectorAll('.heatmap-filter').forEach((button) => button.addEventListener('click', () => {
  window.heatmapFilter = button.dataset.heatSource;
  document.querySelectorAll('.heatmap-filter').forEach((item) => item.classList.toggle('active', item === button));
  renderCodingHeatmap(liveCodingStats);
}));
document.querySelectorAll('.activity-filter').forEach((button) => {
  button.addEventListener('click', () => {
    activityFilter = button.dataset.source;
    document.querySelectorAll('.activity-filter').forEach((item) => item.classList.toggle('active', item === button));
    renderLiveCodingActivity();
  });
});
const load = async () => {
  try { render(await request('/api/dashboard')); }
  catch (error) {
    render({profileCompletion:82,resumeAtsScore:88,coding:{currentStreak:18},career:{applications:23},weeklyCodingActivity:[{day:'Mon',commits:16},{day:'Tue',commits:22},{day:'Wed',commits:19},{day:'Thu',commits:28},{day:'Fri',commits:18},{day:'Sat',commits:12},{day:'Sun',commits:9}],recommendedJobs:[{title:'Software Engineer Intern',company:'Google',match:92,location:'Bengaluru'},{title:'Frontend Engineer',company:'Microsoft',match:88,location:'Hyderabad'},{title:'SDE Intern',company:'Amazon',match:90,location:'Pune'}],dailyGoals:[{title:'Finish DS/A mock interview',status:'In Progress',progress:70},{title:'Submit resume to 3 targets',status:'Pending',progress:35},{title:'Solve 3 LeetCode medium questions',status:'Done',progress:100}]});
  }
  try {
    const summary = await request('/api/student/progress/summary');
    $('github-summary').textContent = `${summary.coding.githubCommits} commits · tracked`;
    $('leetcode-summary').textContent = `${summary.coding.leetcodeSolved} solved · daily streak`;
    $('codeforces-summary').textContent = `${summary.coding.codeforcesRating} rating · tracked`;
    $('resume-summary').textContent = `${summary.resumeAtsScore} / 100 · progress synced`;
  } catch {
    // The dashboard fallback remains useful before a student signs in.
  }
  if (resumeAnalysis) {
    $('ats').textContent = resumeAnalysis.score;
    $('resume-summary').textContent = `${resumeAnalysis.score} / 100 · ${resumeAnalysis.checks.filter(([, passed]) => !passed).length} improvement tips`;
  }
};
$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  try { const result = await request('/api/auth/login', {method: 'POST', body: JSON.stringify(body)}); localStorage.setItem('careeros_token', result.token); $('login').classList.add('hidden'); load(); }
  catch { $('login-error').textContent = 'Unable to sign in. Check your credentials.'; }
});
$('logout').addEventListener('click', () => { localStorage.removeItem('careeros_token'); $('login').classList.remove('hidden'); });
document.querySelectorAll('#overview-nav,#resume-nav,#settings-nav').forEach((item) => item.addEventListener('click', () => {
  if (item.id === 'overview-nav') return showOverview();
  if (item.id === 'resume-nav') return showResumeReview();
  document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.remove('active'));
  item.classList.add('active');
  dialog(item.textContent.trim(), item.id === 'applications-nav' ? 'Your applications and upcoming deadlines are listed below.' : item.id === 'resume-nav' ? 'Resume review and ATS improvements are ready to add here.' : 'Profile preferences and integrations will appear here.', item.id === 'applications-nav' ? 'View applications' : item.id === 'resume-nav' ? 'Review resume' : 'Got it');
}));
const searchableItems = [
  ['Software Engineer Intern', 'Google · Resume skill match'],
  ['Frontend Engineer', 'Microsoft · Resume skill match'],
  ['Finish DS/A mock interview', 'Goal · In Progress'],
  ['Submit resume to 3 targets', 'Goal · Pending'],
  ['Amazon SDE Intern', 'Application · Interview']
];
const renderSearchResults = (query = '') => {
  const results = searchableItems.filter(([title, detail]) => `${title} ${detail}`.toLowerCase().includes(query.toLowerCase()));
  $('dialog-results').innerHTML = results.length
    ? results.map(([title, detail]) => `<div class="dialog-result"><strong>${title}</strong><small>${detail}</small></div>`).join('')
    : '<p class="muted">No matching dashboard items.</p>';
};
let resumeAnalysis = null;
try { resumeAnalysis = JSON.parse(localStorage.getItem('code2career_resume_analysis') || 'null'); } catch { localStorage.removeItem('code2career_resume_analysis'); }
const resumeJobs = [
  {title: 'Frontend Engineer Intern', company: 'Microsoft', skills: ['javascript', 'react', 'typescript'], location: 'Hyderabad', mode: 'onsite', paid: true, source: 'Internshala', url: 'https://internshala.com/internships/keywords-frontend-development/'},
  {title: 'Software Engineer Intern', company: 'Google', skills: ['java', 'python', 'sql'], location: 'Bengaluru', mode: 'onsite', paid: true, source: 'Unstop', url: 'https://unstop.com/internships'},
  {title: 'Full Stack Developer Intern', company: 'Amazon', skills: ['javascript', 'node', 'sql'], location: 'Pune', mode: 'onsite', paid: true, source: 'Internshala', url: 'https://internshala.com/internships/keywords-full-stack-development/'},
  {title: 'Remote Data Analyst Internship', company: 'Deloitte', skills: ['python', 'sql', 'excel'], location: 'Remote', mode: 'remote', paid: false, source: 'Unstop', url: 'https://unstop.com/internships'},
  {title: 'Backend Java Developer Intern', company: 'TCS', skills: ['java', 'sql', 'docker'], location: 'Chennai', mode: 'onsite', paid: true, source: 'Internshala', url: 'https://internshala.com/internships/keywords-java-development/'}
];
const analyzeResume = (text) => {
  const normalized = text.toLowerCase();
  const checks = [
    ['Contact details', /[\w.+-]+@[\w.-]+\.[a-z]{2,}/.test(normalized) || /\+?\d[\d\s-]{8,}/.test(normalized)],
    ['Professional summary', /(summary|objective|profile)/.test(normalized)],
    ['Skills section', /(skills|technical skills|technologies)/.test(normalized)],
    ['Experience section', /(experience|employment|internship)/.test(normalized)],
    ['Projects section', /projects?/.test(normalized)],
    ['Education section', /(education|university|college|bachelor|degree)/.test(normalized)],
    ['Quantified impact', /\b\d+%|\b\d+\+|\b\d+x\b|\b\d+\s*(users|projects|issues|members)/.test(normalized)],
    ['Action verbs', /(built|developed|implemented|optimized|led|automated|designed)/.test(normalized)]
  ];
  const score = Math.min(100, 30 + checks.filter(([, passed]) => passed).length * 8 + (text.length > 900 ? 6 : 0));
  const detectedSkills = ['javascript', 'typescript', 'react', 'java', 'python', 'sql', 'node', 'aws', 'docker', 'c++', 'excel']
    .filter((skill) => normalized.includes(skill));
  const recommendations = resumeJobs.map((job) => {
    const matches = job.skills.filter((skill) => detectedSkills.includes(skill)).length;
    return {...job, match: Math.min(98, 62 + matches * 11)};
  }).sort((a, b) => b.match - a.match);
  return {score, checks, detectedSkills, recommendations, updatedAt: new Date().toISOString()};
};
const showResumeReview = () => {
  dialog('ATS resume review', 'Upload your resume PDF, then submit it to calculate your ATS score and detect your technical skills.', 'Close');
  $('resume-upload').classList.remove('hidden');
  $('resume-status').textContent = resumeAnalysis ? 'A previous review is saved. Upload a PDF and submit to refresh it.' : 'Your PDF is analyzed locally in this browser.';
  $('resume-submit').disabled = false;
};
window.openResumeReview = showResumeReview;
document.addEventListener('click', (event) => {
  if (event.target.closest('#resume-action')) showResumeReview();
}, true);
const renderResumeAnalysis = (analysis) => {
  $('resume-status').textContent = `Analyzed ${new Date(analysis.updatedAt).toLocaleString()} · ${analysis.detectedSkills.length || 0} skills detected`;
  const missingSections = analysis.checks.filter(([, passed]) => !passed).map(([name]) => name);
  const skills = analysis.detectedSkills.length
    ? analysis.detectedSkills.map((skill) => `<span class="skill-chip">${skill}</span>`).join('')
    : '<span class="muted">No technical skills detected yet.</span>';
  $('dialog-results').innerHTML = `<div class="ats-score">${analysis.score} / 100 ATS score</div><h3>Technical skills</h3><div class="skill-chips">${skills}</div><p class="muted">${missingSections.length ? 'Improve: ' + missingSections.join(', ') : 'Strong resume structure detected.'}</p>`;
  $('ats').textContent = analysis.score;
  $('resume-summary').textContent = `${analysis.score} / 100 · ${analysis.checks.filter(([, passed]) => !passed).length} improvement tips`;
};
const matchingJobs = (filters = {}) => {
  const skills = resumeAnalysis?.detectedSkills || [];
  return resumeJobs.map((job) => ({...job, matchedSkills: job.skills.filter((skill) => skills.includes(skill))}))
    .filter((job) => job.matchedSkills.length > 0)
    .filter((job) => (!filters.location || filters.location === 'all' || (filters.location === 'remote' ? job.mode === 'remote' : job.location.toLowerCase() === filters.location)))
    .filter((job) => (!filters.mode || filters.mode === 'all' || job.mode === filters.mode))
    .filter((job) => (!filters.paid || filters.paid === 'all' || (filters.paid === 'paid' ? job.paid : !job.paid)))
    .sort((a, b) => b.matchedSkills.length - a.matchedSkills.length);
};
const filteredRecommendations = (location, mode, paid) => matchingJobs({location, mode, paid});
const renderDashboardRecommendations = (fallbackJobs = []) => {
  const location = $('dashboard-job-location-filter')?.value || 'all';
  const mode = $('dashboard-job-mode-filter')?.value || 'all';
  const paid = $('dashboard-job-paid-filter')?.value || 'all';
  const jobs = resumeAnalysis ? filteredRecommendations(location, mode, paid) : [];
  $('jobs').innerHTML = jobs.length ? jobs.map((job) => `<div class="job"><div class="company-logo">${job.company[0]}</div><div class="job-info"><strong>${job.title}</strong><small>Resume skills: ${job.matchedSkills.join(', ')} · ${job.mode === 'remote' ? 'Work from home' : 'On-site'} · ${job.paid ? 'Paid' : 'Compensation varies'}</small><a class="job-source" href="${job.url}" target="_blank" rel="noopener noreferrer">Open live ${job.source} results ↗</a></div></div>`).join('') : '<p class="muted">Upload and submit a resume with matching technical skills to receive recommendations.</p>';
};
const renderJobRecommendations = () => {
  const jobs = matchingJobs({location: $('job-location-filter').value, mode: $('job-mode-filter').value, paid: $('job-paid-filter').value});
  $('dialog-results').innerHTML = jobs.length ? jobs.map((job) => `<div class="recommendation"><div><strong>${job.title}</strong><small>${job.company} · Resume skills: ${job.matchedSkills.join(', ')} · ${job.location} · ${job.mode === 'remote' ? 'Work from home' : 'On-site'} · ${job.paid ? 'Paid' : 'Compensation varies'}</small><a class="job-source" href="${job.url}">Open live ${job.source} results ↗</a></div></div>`).join('') : '<p class="muted">Upload and submit a resume with matching technical skills to receive recommendations.</p>';
};
const showJobRecommendations = () => {
  dialog('Live job & internship recommendations', 'Matched to your resume skills. Results open live searches on Internshala and Unstop.', 'Close');
  $('job-location-filter').value = 'all';
  $('job-mode-filter').value = 'all';
  $('job-paid-filter').value = 'all';
  $('job-filters').classList.remove('hidden');
  renderJobRecommendations();
};
['job-location-filter', 'job-mode-filter', 'job-paid-filter'].forEach((id) => $(id).addEventListener('change', renderJobRecommendations));
let selectedResumeFile = null;
document.getElementById('resume-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    $('resume-status').textContent = 'Please choose a PDF resume.';
    selectedResumeFile = null;
    return;
  }
  selectedResumeFile = file;
  $('resume-status').textContent = `${file.name} selected. Press Submit for ATS review.`;
});
document.getElementById('resume-submit').addEventListener('click', async () => {
  if (!selectedResumeFile) {
    $('resume-status').textContent = 'Choose a PDF resume before submitting.';
    return;
  }
  $('resume-status').textContent = 'Reading your resume…';
  $('resume-submit').disabled = true;
  try {
    if (!window.pdfjsLib) throw new Error('PDF reader unavailable');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({data: await selectedResumeFile.arrayBuffer()}).promise;
    let text = '';
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += `${content.items.map((item) => item.str).join(' ')}\n`;
    }
    const analysis = analyzeResume(text);
    resumeAnalysis = analysis;
    localStorage.setItem('code2career_resume_analysis', JSON.stringify(analysis));
    $('dialog-results').classList.remove('hidden');
    renderResumeAnalysis(analysis);
  } catch (error) {
    $('resume-status').textContent = 'Could not read this PDF. Try a text-based PDF export.';
    $('resume-submit').disabled = false;
  }
});
document.getElementById('search-button').addEventListener('click', () => {
  dialog('Search', 'Find jobs, applications, goals, and coding activity.', 'Close');
  $('dialog-search').classList.remove('hidden');
  $('dialog-search').focus();
  renderSearchResults();
});
document.getElementById('dialog-search').addEventListener('input', (event) => renderSearchResults(event.target.value));
const applyTheme = (dark) => {
  document.body.classList.toggle('dark-mode', dark);
  $('theme-toggle').textContent = dark ? '☀' : '☾';
  $('theme-toggle').title = dark ? 'Switch to light mode' : 'Switch to dark mode';
};
applyTheme(localStorage.getItem('code2career_theme') === 'dark');
document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = !document.body.classList.contains('dark-mode');
  localStorage.setItem('code2career_theme', dark ? 'dark' : 'light');
  applyTheme(dark);
});
document.getElementById('period-select').addEventListener('click', (event) => {
  event.currentTarget.textContent = event.currentTarget.textContent.includes('week') ? 'Last 30 days⌄' : 'This week⌄';
  dialog('Activity range updated', `Showing ${event.currentTarget.textContent.replace('⌄', '') .toLowerCase()} activity.`);
});
['dashboard-job-location-filter', 'dashboard-job-mode-filter', 'dashboard-job-paid-filter'].forEach((id) => { if ($(id)) $(id).addEventListener('change', () => renderDashboardRecommendations()); });
['page-job-location-filter', 'page-job-mode-filter', 'page-job-paid-filter'].forEach((id) => $(id).addEventListener('change', renderJobsPageRecommendations));
if (document.getElementById('goals-link')) document.getElementById('goals-link').addEventListener('click', (event) => { event.preventDefault(); dialog("Today's goals", 'Keep going: one goal is done, one is in progress, and one is pending.'); });
document.getElementById('resume-action').addEventListener('click', showResumeReview);
document.getElementById('jobs-action').addEventListener('click', showJobs);
document.getElementById('reminder-action').addEventListener('click', () => dialog('WhatsApp coach', 'Set WHATSAPP_ENABLED=true and configure a WhatsApp Cloud API token and phone number on the backend to enable reminders.'));
document.getElementById('close-dialog').addEventListener('click', closeDialog);
document.getElementById('dialog-action').addEventListener('click', closeDialog);
skillsNav.addEventListener('click', showSkills);
document.getElementById('jobs-back-overview').addEventListener('click', showOverview);
document.getElementById('applications-back-overview').addEventListener('click', showOverview);
document.getElementById('back-overview').addEventListener('click', showOverview);
document.getElementById('application-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const applications = readApplications();
  applications.unshift({...data, id: Date.now().toString(), created: new Date().toLocaleDateString()});
  localStorage.setItem('code2career_applications', JSON.stringify(applications));
  event.currentTarget.reset();
  renderApplications();
});
document.getElementById('application-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-application-id]');
  if (!button) return;
  localStorage.setItem('code2career_applications', JSON.stringify(readApplications().filter((item) => item.id !== button.dataset.applicationId)));
  renderApplications();
});
const profileLinksForm = document.getElementById('profile-links-form');
const profileLinkFields = ['github', 'leetcode', 'codeforces'];
const allowedProfileHosts = {
  github: ['github.com', 'www.github.com'],
  leetcode: ['leetcode.com', 'www.leetcode.com'],
  codeforces: ['codeforces.com', 'www.codeforces.com']
};
const readSavedProfileLinks = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('code2career_profile_links') || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    localStorage.removeItem('code2career_profile_links');
    return {};
  }
};
const readLiveProfileStats = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('code2career_live_profile_stats') || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    localStorage.removeItem('code2career_live_profile_stats');
    return {};
  }
};
const mergeLiveProfile = (name, profile) => {
  const previous = readLiveProfileStats()[name];
  if (name === 'codeforces' && previous && Number(profile.solved) === 0 && Number(previous.solved) > 0) {
    return {...profile, solved: previous.solved, streak: previous.streak};
  }
  return profile;
};
const renderLiveProfileStats = (stats) => {
  renderLiveCodingActivity(stats);
  renderCodingHeatmap(stats);
  updateCurrentStreak(stats);
  if (stats.github) {
    $('github-summary').textContent = `${stats.github.repositories} repositories · ${stats.github.followers} followers`;
    $('github-progress').textContent = `${stats.github.repositories} public repositories · ${stats.github.followers} followers`;
    $('github-status').textContent = stats.github.live === false ? (stats.github.message || 'GitHub activity unavailable') : 'Live GitHub data · updated now';
    $('github-detail').textContent = `${stats.github.repositories} public repositories · ${stats.github.followers} followers`;
    $('github-repositories').textContent = stats.github.repositories;
    $('github-streak').textContent = `${stats.github.streak || 0} days`;
  }
  if (stats.leetcode) {
    $('leetcode-summary').textContent = `${stats.leetcode.solved} solved · live profile`;
    $('leetcode-progress').textContent = `${stats.leetcode.solved} problems solved · live profile`;
    $('leetcode-status').textContent = 'Live LeetCode data · updated now';
    $('leetcode-detail').textContent = `${stats.leetcode.solved} solved · Easy ${stats.leetcode.easy}, Medium ${stats.leetcode.medium}, Hard ${stats.leetcode.hard}`;
    $('leetcode-solved').textContent = stats.leetcode.solved;
    $('leetcode-streak').textContent = `${stats.leetcode.streak || 0} days`;
  }
  if (stats.codeforces) {
    $('codeforces-summary').textContent = `${stats.codeforces.rating} rating · ${stats.codeforces.maxRating} peak`;
    $('codeforces-progress').textContent = `${stats.codeforces.rating} current rating · ${stats.codeforces.maxRating} peak`;
    $('codeforces-status').textContent = 'Live Codeforces data · updated now';
    $('codeforces-detail').textContent = `${stats.codeforces.solved} solved · ${stats.codeforces.rating} rating`;
    $('codeforces-solved').textContent = stats.codeforces.solved;
    $('codeforces-streak').textContent = `${stats.codeforces.streak || 0} days`;
  }
};
const savedProfileLinks = readSavedProfileLinks();
const savedLiveProfileStats = readLiveProfileStats();
profileLinkFields.forEach((name) => {
  if (savedProfileLinks[name]) $(`${name}-link`).value = savedProfileLinks[name];
});
const updateProfileStatus = (links) => {
  if (links.leetcode) {
    $('leetcode-status').textContent = 'Profile saved · live stats sync pending';
    $('leetcode-progress').textContent = 'Profile connected · awaiting LeetCode data';
  }
  if (Object.values(links).some(Boolean)) {
    $('profile-links-status').textContent = 'Profile links saved.';
  }
};
updateProfileStatus(savedProfileLinks);
renderLiveProfileStats(savedLiveProfileStats);
const profileUsername = (name, link) => {
  const parts = new URL(link).pathname.split('/').filter(Boolean);
  if (name === 'leetcode' && parts[0] === 'u') return parts[1];
  if (name === 'codeforces' && parts[0] === 'profile') return parts[1];
  return parts[0];
};
const refreshProfileStats = async (name, link) => {
  const username = profileUsername(name, link);
  $(`${name}-status`).textContent = 'Syncing live stats…';
  if (name === 'github') {
    const profile = await request(`/api/student/public/profile-stats/github/${encodeURIComponent(username)}`);
    $('github-progress').textContent = `${profile.repositories} public repositories · ${profile.followers} followers`;
    $('github-status').textContent = 'Live GitHub data · updated now';
    return profile;
  }
  if (name === 'codeforces') {
    let profile = await request(`/api/student/public/profile-stats/codeforces/${encodeURIComponent(username)}?refresh=${Date.now()}`);
    if (Number(profile.solved) === 0) {
      const retry = await request(`/api/student/public/profile-stats/codeforces/${encodeURIComponent(username)}?retry=${Date.now() + 1}`);
      if (Number(retry.solved) > Number(profile.solved)) profile = retry;
    }
    $('codeforces-progress').textContent = `${profile.rating || 'Unrated'} current rating · ${profile.maxRating || 'Unrated'} peak`;
    $('codeforces-status').textContent = 'Live Codeforces data · updated now';
    const normalized = {
      ...profile,
      solved: Number(profile.solved) || 0,
      streak: Number(profile.streak) || 0
    };
    $('codeforces-detail').textContent = `${normalized.solved} solved · ${normalized.rating || 'Unrated'} rating`;
    $('codeforces-solved').textContent = normalized.solved;
    $('codeforces-streak').textContent = `${normalized.streak} days`;
    return normalized;
  }
  const profile = await request(`/api/student/public/profile-stats/leetcode/${encodeURIComponent(username)}`);
  $('leetcode-progress').textContent = `${profile.solved} problems solved · live profile`;
  $('leetcode-status').textContent = 'Live LeetCode data · updated now';
  return profile;
};
const saveProfile = async (name) => {
  const input = $(`${name}-link`);
  const link = input.value.trim();
  if (!link) {
    $('profile-links-status').textContent = `Enter a ${name} profile URL.`;
    input.focus();
    return;
  }
  let url;
  try {
    url = new URL(link);
  } catch {
    $('profile-links-status').textContent = `Enter a valid ${name} URL.`;
    input.focus();
    return;
  }
  if (url.protocol !== 'https:' || !allowedProfileHosts[name].includes(url.hostname.toLowerCase())) {
    $('profile-links-status').textContent = `Use a public https://${allowedProfileHosts[name][0]} profile link.`;
    input.focus();
    return;
  }
  const links = {...readSavedProfileLinks(), [name]: url.href.replace(/\/$/, '')};
  try {
    localStorage.setItem('code2career_profile_links', JSON.stringify(links));
  } catch {
    $('profile-links-status').textContent = 'Unable to save profile links in this browser.';
    return;
  }
  updateProfileStatus(links);
  try {
    const profile = await refreshProfileStats(name, links[name]);
    const liveStats = {...readLiveProfileStats(), [name]: mergeLiveProfile(name, profile)};
    localStorage.setItem('code2career_live_profile_stats', JSON.stringify(liveStats));
    renderLiveProfileStats(liveStats);
    $('profile-links-status').textContent = `${name[0].toUpperCase() + name.slice(1)} saved and updated with live data.`;
  } catch (error) {
    $(`${name}-status`).textContent = 'Profile saved · live sync unavailable';
    $('profile-links-status').textContent = `${name[0].toUpperCase() + name.slice(1)} saved, but live stats could not be loaded.`;
  }
};
const refreshSavedProfiles = async () => {
  const links = readSavedProfileLinks();
  for (const name of profileLinkFields) {
    if (!links[name]) continue;
    try {
      const profile = await refreshProfileStats(name, links[name]);
      const liveStats = {...readLiveProfileStats(), [name]: mergeLiveProfile(name, profile)};
      localStorage.setItem('code2career_live_profile_stats', JSON.stringify(liveStats));
      renderLiveProfileStats(liveStats);
    } catch {
      // Keep the last successful snapshot visible when a provider is temporarily unavailable.
    }
  }
};
document.querySelectorAll('.profile-save').forEach((button) => {
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await saveProfile(button.dataset.profile);
    } finally {
      button.disabled = false;
    }
  });
});
profileLinksForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveProfile('github');
});
if (new URLSearchParams(window.location.search).has('skills-test') || window.location.hash === '#skills') {
  showSkills();
}
load().then(refreshSavedProfiles);
