import type { Field, Section } from './types';
import { seasonsData, type SeasonData } from '@/data/seasonsData';

/**
 * Every admin-editable piece of website content.
 *
 * `defaults` is what the site shows until an admin edits the section in
 * Admin → Site content. Text fields may use {season} (the Season label from
 * General) and {site}. Headline fields marked "rich" highlight *starred*
 * words in gold.
 */

const LOGO = '/lovable-uploads/58911c41-3ed8-4807-8789-5df7d2fff02c.png';

// ── Reusable field sets ────────────────────────────────────────────────
const titleDesc: Field[] = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
];
const qa: Field[] = [
  { key: 'question', label: 'Question', type: 'text' },
  { key: 'answer', label: 'Answer', type: 'textarea' },
];

// ── General ────────────────────────────────────────────────────────────
const general = {
  site_name: 'TuronMUN',
  season_label: 'Season 7',
  conference_date: '',
  logo_url: LOGO,
  contact_email: 'admin@turonmun.com',
  contact_phone: '+998903672103',
  instagram_url: 'https://www.instagram.com/turon.mun/',
  telegram_url: 'https://t.me/TuronMUN',
  links_url: 'https://myurls.co/turonmunconference',
  sponsorship_url: 'http://t.me/ozodjonov_mh',
  footer_about: 'Join us for an enriching diplomatic simulation that brings together students from around the world to discuss pressing global issues.',
  footer_credits: 'Coded & created by Numonov Samandar & Asadbek Abdukhalilov',
  footer_credits_url: 'https://t.me/samandar_vibe',
};

// ── Homepage ───────────────────────────────────────────────────────────
const next_season = {
  badge_label: 'Next Season',
  heading: 'Coming Soon',
  subtitle: 'Details will be announced shortly.',
  date_text: 'To be announced',
  duration_text: 'To be announced',
  location_text: 'Fergana, Uzbekistan',
  delegates_text: 'To be announced',
  apply_label: 'Apply now',
};

const hero = {
  eyebrow: 'Model United Nations',
  phrases: [
    "Shaping Tomorrow's Leaders",
    'Build Lasting Connections',
    'Shape the Future of Diplomacy',
    'Empowering Youth Diplomacy',
  ],
  intro: 'Join delegates from across Uzbekistan to debate pressing global issues, develop leadership skills, and forge valuable connections at our prestigious Model UN conference.',
  apply_button: 'Apply Now',
  committees_button: 'Explore Committees',
  accolades: [
    'Ranked top on MyMUN charts',
    'Best social conference',
    'Best small conference',
    'Best logistics conference',
    "Central Asia's leading MUN",
    'Expert academic & chairing team',
    '6 successful seasons',
  ],
};

const home_about = {
  badge: 'About Our Conference',
  headline: 'We are the only MUN from *Central Asia* that topped the *mymun charts* *back-to-back*',
  paragraphs: [
    'Our Model United Nations conference provides a unique platform for students to simulate international diplomacy and develop a deep understanding of global issues. Through carefully designed committee sessions, workshops, and social events, participants gain valuable skills while building lifelong connections.',
    "Whether you're a seasoned delegate or new to MUN, our conference offers opportunities for growth, learning, and meaningful engagement with international affairs.",
  ],
  stats: [
    { label: 'Delegates Empowered', value: 500, suffix: '+' },
    { label: 'Countries Represented', value: 3, suffix: '' },
    { label: 'Committees', value: 15, suffix: '+' },
    { label: 'Seasons of Excellence', value: 7, suffix: '' },
  ],
  features: [
    { title: 'Why TuronMUN?', description: 'Experience authentic international diplomacy through immersive crisis scenarios that place real global challenges in your hands.' },
    { title: 'Why TuronMUN?', description: 'Transform into a master negotiator through thrilling consensus-building exercises that mirror high-stakes international diplomacy perfectly.' },
    { title: 'Why TuronMUN?', description: 'Forge powerful connections with exceptional delegates who share your passion for justice and bring diverse cultural perspectives.' },
    { title: 'Why TuronMUN?', description: 'Unleash your intellectual potential through masterfully designed challenges that sharpen analytical prowess and eloquent speaking abilities.' },
  ],
};

const home_sections = {
  committees_eyebrow: 'For Delegates',
  committees_title: 'Our Committees',
  committees_intro: 'Explore our diverse committees where you can debate critical global issues, forge diplomatic relationships, and develop leadership skills.',
  committees_button: 'View All Committees',
  schedule_eyebrow: 'Event Schedule',
  schedule_title: 'Conference Agenda',
  schedule_intro: "Here's a preview of our event schedule. For the complete agenda and details, please visit the Schedule page.",
  schedule_empty: 'The conference schedule will be available soon. Check back later for updates!',
  faq_eyebrow: 'Questions?',
  faq_title: 'Frequently Asked Questions',
  faq_intro: 'Find answers to common questions about our MUN conference, application process, and more.',
};

const faq = {
  items: [
    { question: 'What is Model United Nations?', answer: "Model United Nations (MUN) is an educational simulation where students role-play as delegates representing different countries in UN committees. Participants research global issues, represent their assigned country's positions, debate, and draft resolutions to address international challenges." },
    { question: 'Who can participate in the conference?', answer: 'Our conference welcomes university and high school students from all around the world. We accept both individual applications and delegations from academic institutions.' },
    { question: 'How much does participation cost?', answer: 'Participation fees vary depending on whether you are applying as an individual delegate or as part of a delegation. Early bird rates and discounts for returning delegates are available. Please check the Application page for current pricing details.' },
    { question: 'What is the conference language?', answer: 'The conference is conducted primarily in English. Most committee sessions, documentation, and communication are in English. Each season also features one Russian-language committee for participants more comfortable in Russian.' },
    { question: 'Do I need previous MUN experience to participate?', answer: 'No, prior experience is not required. We welcome delegates of all experience levels. We provide training sessions and resources for first-time participants to ensure everyone can engage meaningfully in the conference.' },
    { question: 'What should I do to prepare for the conference?', answer: 'Preparation includes researching your assigned country and committee topics, drafting position papers, and reviewing parliamentary procedure. We provide a delegate handbook and research guides to assist you in your preparation.' },
  ],
};

const sponsors = {
  badge: 'Proud Partners',
  heading: 'Sponsors Powering *TuronMUN*',
  intro: 'Our Season 6 partners help us deliver immersive diplomatic simulations, scholarships, and a world-class experience for every delegate. Explore the brands shaping the future with us.',
  empty_text: '{season} sponsors will be announced here. Reach out if you\'d like to partner with us.',
  cta_eyebrow: 'Become A Sponsor',
  cta_text: 'Partner with TuronMUN Season 6 to inspire the next generation of diplomats through workshops, scholarships, and immersive experiences.',
  cta_button: 'Sponsor With Us',
  cta_url: '/contact',
  logos: [
    { name: 'Sponsor 1', image: '/logos/logo1.png', url: '' },
    { name: 'Sponsor 2', image: '/logos/logo2.png', url: '' },
    { name: 'Sponsor 4', image: '/logos/logo4.png', url: '' },
    { name: 'Sponsor 5', image: '/logos/logo5.png', url: '' },
    { name: 'Sponsor 6', image: '/logos/logo6.png', url: '' },
  ],
};

// ── About page ─────────────────────────────────────────────────────────
const about_page = {
  badge: 'About TuronMUN',
  title: "Shaping Tomorrow's Global Leaders",
  intro: 'Join us in fostering international cooperation, developing leadership skills, and creating lasting connections in the world of Model United Nations.',
  primary_button: 'Join Our Community',
  secondary_button: 'Past Conferences',
  mission_title: 'Our Mission & Values',
  mission_intro: 'We are dedicated to empowering the next generation of global leaders through immersive diplomatic experiences.',
  mission_statement: 'To inspire and equip young people with the diplomatic skills, global awareness, and leadership capabilities needed to address the complex challenges of our interconnected world.',
  values: [
    { title: 'Global Impact', description: 'Fostering international understanding and cooperation through simulated diplomatic experiences that tackle real-world issues.' },
    { title: 'Diverse Community', description: 'Bringing together students from various backgrounds, cultures, and perspectives to share ideas and build lasting connections.' },
    { title: 'Excellence', description: 'Promoting high standards in research, debate, and diplomatic protocol to prepare future leaders for global challenges.' },
    { title: 'Skill Development', description: 'Building essential skills in public speaking, negotiation, critical thinking, and collaborative problem-solving.' },
    { title: 'Educational Focus', description: 'Creating rich learning experiences that complement academic curricula and deepen understanding of international relations.' },
    { title: 'Balanced Representation', description: 'Ensuring all nations and perspectives are represented fairly, with special attention to underrepresented regions.' },
    { title: 'Innovation', description: 'Continuously evolving our conference formats and topics to reflect the changing nature of global diplomacy and challenges.' },
    { title: 'Inclusive Environment', description: 'Creating a supportive, respectful space where every delegate can participate fully regardless of experience level.' },
  ],
  timeline_title: 'Our Journey',
  timeline_intro: 'Our journey from humble beginnings to becoming a recognized name in the MUN community.',
  timeline: [
    { date: 'June 28, 2024', title: 'FPS MUN Founded', description: 'The beginning of our journey with a vision to create a premier MUN experience.', milestones: ['Official founding of turonmun', 'Telegram channel created', 'Registered through mymun.com'] },
    { date: 'July 1, 2024', title: 'Season 1 Application Opens', description: 'Launching our first season with great enthusiasm and participation.', milestones: ['Application for first season begins', '80 delegates from across Uzbekistan participated', 'Held on July 28, 2024'] },
    { date: 'November 5, 2024', title: 'Season 2', description: 'A focused season with smaller committees, laying the groundwork for our expansion.', milestones: ['2 committees', 'Location: Presidential School in Fergana'] },
    { date: 'January 4, 2025', title: 'Season 3', description: 'Our biggest event yet with expanded committees and delegate participation.', milestones: ['5 committees', '105 delegates', 'Location: Presidential School in Fergana'] },
    { date: 'January 25, 2025', title: 'Historic Partnership', description: 'Game-changing partnership with Nukus Central Asian University MUN.', milestones: ['First MUN conference in Karakalpakstan', 'Expanding MUN culture in new regions', 'Strengthening national MUN community'] },
    { date: 'May 1, 2025', title: 'Global Recognition', description: 'FerganaPSMUN 2024 wins multiple awards on MyMUN.', milestones: ['Best Small Conference', 'Best Socials', 'Best Logistics', 'First for Central Asia on this scale'] },
    { date: 'May 12, 2025', title: 'Rebranding to TuronMUN', description: 'A new era and identity begins.', milestones: ['Transition from turonmun to TuronMUN', 'New vision for the future', 'Continued commitment to excellence in MUN'] },
    { date: 'July 28, 2025', title: 'United Celebration', description: 'Celebrating our anniversary with a special collaboration at Central Asian Medical University.', milestones: ['First joint MUN with a medical university', "Celebrating TuronMUN's anniversary with a special event", '6 vibrant committees in 3 languages'] },
    { date: 'November 9, 2025', title: 'Season 5', description: 'Our first conference under new Secretary-General, marking a new chapter in our growth', milestones: ['Historic partnership with Registan Private School', 'Beginning of a new era with new leadership', '5 committees in 2 languages'] },
    { date: 'March 29, 2026', title: 'Season 6', description: 'Our most ambitious season yet, continuing the legacy of leadership and diplomacy.', milestones: ['Continued partnership with SATashkent', '80 elite delegates across Uzbekistan', 'New awarding strategies'] },
  ],
  seasons_title: 'Our Seasons of Diplomacy',
  seasons_intro: "Our journey through the seasons, showcasing our growth and the impact we've made in the MUN community.",
  seasons_button: 'Explore Current Committees',
  testimonials_title: 'Voices from Our Community',
  testimonials_intro: 'Hear from our community members about their TuronMUN experiences.',
  testimonials: [
    { quote: "Participating in TuronMUN has significantly improved my public speaking and diplomatic skills. I've been part of it since the first season, and each time I learn something new and valuable.", author: 'Azizbek Ismoilov', role: 'Delegate, Seasons 1-4' },
    { quote: 'The committees were engaging and the topics were thought-provoking, pushing us to think critically about global issues.', author: 'Dilfuza Qodirova', role: 'MUN Coordinator' },
    { quote: 'Leading one of the five committees in Season 3 was an incredible experience. Working with 105 delegates was both challenging and rewarding, and the level of organization was outstanding.', author: 'Javohir Toshmatov', role: 'Committee Chair, Season 3' },
    { quote: "My son participated in Season 2, and it was one of the best experiences of his life. Now his younger sister can't wait to join as well!", author: 'Dilbar Otabekova', role: 'Parent of Season 2 Delegate' },
    { quote: "Winning 'Best Social Media' on MyMUN was a proud moment for our entire team. It's amazing to see our hard work recognized on an international platform!", author: 'Shahzod Kholmatov', role: 'Social Media Coordinator' },
    { quote: "Watching our evolution from turonmun to TuronMUN has been incredible. The growth of our team and program fills me with pride for what we've accomplished together.", author: 'Madina Karimova', role: 'Organizing Committee Member, Seasons 1-4' },
  ],
  gallery_title: 'TuronMUN in Action',
  gallery_intro: 'Moments from our previous conferences showcasing the TuronMUN experience.',
  gallery: [
    { image: '/lovable-uploads/mun-action-1.jpg', alt: 'TuronMUN Delegates in Action', caption: 'Delegates engaged in committee discussions' },
    { image: '/lovable-uploads/mun-action-2.jpg', alt: 'TuronMUN Committee Session', caption: 'Active participation in committee session' },
    { image: '/lovable-uploads/mun-action-3.jpg', alt: 'TuronMUN Debate', caption: 'Delegates passionately debating global issues' },
    { image: '/lovable-uploads/mun-action-4.jpg', alt: 'TuronMUN Speakers', caption: "Delegates delivering their country's position" },
    { image: '/lovable-uploads/mun-action-5.jpg', alt: 'TuronMUN Group Photo', caption: 'TuronMUN participants and organizers' },
    { image: '/lovable-uploads/mun-action-6.jpg', alt: 'TuronMUN Closing Ceremony', caption: 'Awarding outstanding delegates' },
  ],
};

// ── Past seasons ───────────────────────────────────────────────────────
const past_conferences = {
  title: 'Past Conferences',
  intro: 'Explore our previous conference seasons, each focused on critical global issues and featuring distinguished delegates from around the world.',
  cta_title: 'Join Our Next Conference',
  cta_text: 'Be part of our upcoming season and contribute to meaningful discussions on pressing global issues.',
  cta_button: 'Apply Now',
};

// Menu order on the site follows this list's order.
const MENU_ORDER = ['season1', 'season2', 'season3', 'season4', 'turonmun-camu', 'season5', 'season6'];
const MENU_LABELS: Record<string, string> = {
  season1: 'Season 1', season2: 'Season 2', season3: 'Season 3', season4: 'Season 4',
  'turonmun-camu': 'TuronMUN x CAMU', season5: 'Season 5', season6: 'Season 6',
};
export type PastSeason = SeasonData & { menu_label: string; show_in_menu: boolean };
const past_seasons = {
  seasons: MENU_ORDER
    .map(id => seasonsData.find(s => s.id === id))
    .filter((s): s is (typeof seasonsData)[number] => !!s)
    .map(s => ({ ...s, menu_label: MENU_LABELS[s.id] ?? s.title, show_in_menu: true })) as PastSeason[],
};

const seasonFields: Field[] = [
  { key: 'title', label: 'Title', type: 'text', hint: 'e.g. Season Seven' },
  { key: 'menu_label', label: 'Menu label', type: 'text', hint: 'Shown under Past Conferences in the menu' },
  { key: 'show_in_menu', label: 'Show in menu', type: 'boolean' },
  { key: 'route', label: 'Page address', type: 'text', hint: 'e.g. /seasons/7 — must start with /seasons/' },
  { key: 'id', label: 'Internal ID', type: 'text', hint: 'Unique, no spaces, e.g. season7' },
  { key: 'year', label: 'Year', type: 'text' },
  { key: 'date', label: 'Date', type: 'text', hint: 'As shown, e.g. March 29, 2026' },
  { key: 'endDate', label: 'End date (optional)', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'theme', label: 'Theme', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'experience', label: 'Experience / story', type: 'textarea' },
  { key: 'milestone', label: 'Milestone', type: 'text' },
  { key: 'highlights', label: 'Highlights', type: 'strings' },
  {
    key: 'statistics', label: 'Statistics', type: 'group', fields: [
      { key: 'participants', label: 'Participants', type: 'text' },
      { key: 'committees', label: 'Committees', type: 'number' },
      { key: 'location', label: 'Venue', type: 'text' },
      { key: 'languages', label: 'Languages', type: 'text' },
      { key: 'fee', label: 'Fee', type: 'text' },
    ],
  },
  { key: 'photos', label: 'Photos', type: 'list', itemLabel: 'Photo', titleKey: 'caption', fields: [
    { key: 'url', label: 'Image', type: 'image' },
    { key: 'caption', label: 'Caption', type: 'text' },
  ] },
  { key: 'organizers', label: 'Organizers', type: 'list', itemLabel: 'Organizer', titleKey: 'name', fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'image', label: 'Photo', type: 'image' },
  ] },
  {
    key: '__style', label: 'Colours (advanced)', type: 'group', collapsed: true,
    hint: 'Tailwind classes. New seasons copy these from the season above; you rarely need to change them.',
    fields: [
      { key: 'color', label: 'Gradient', type: 'text' },
      { key: 'accentColor', label: 'Accent', type: 'text' },
      { key: 'lightBg', label: 'Light background', type: 'text' },
      { key: 'mediumBg', label: 'Medium background', type: 'text' },
      { key: 'borderColor', label: 'Border', type: 'text' },
      { key: 'textColor', label: 'Text colour', type: 'text' },
      { key: 'secondaryTextColor', label: 'Secondary text colour', type: 'text' },
      { key: 'patternStyle', label: 'Pattern', type: 'text' },
    ],
  },
];

// ── Other pages ────────────────────────────────────────────────────────
const registration = {
  badge_closed: '{season} — Applications Opening Soon',
  badge_open: '{season} — Applications Open',
  title: 'Apply for {season}',
  intro_closed: "We're preparing the next chapter of TuronMUN. Applications for delegates and chairs will open shortly — follow us to be the first to know.",
  intro_open: 'Choose your role below and begin your TuronMUN journey.',
  delegate_description: 'Represent a country in one of our committees. Debate, draft resolutions, and practise diplomacy.',
  chair_description: 'Lead a committee as a chair. Shape the debate and guide delegates through the session.',
  observer_enabled: true,
  observer_title: 'Observer',
  observer_description: 'Attend the conference as an observer. Watch debates, take notes, and learn from the floor.',
  observer_url: 'https://forms.gle/95J7rWqQoTEvo2Rr7',
  chair_form_subtitle: '{season} — Lead a committee and shape the TuronMUN experience',
  volunteer_form_subtitle: '{season} — Help make the conference unforgettable',
  signup_tip: 'Create an account to get early access to {season} application when it opens!',
};

const pages = {
  committees_badge: '{season}',
  committees_title: 'Our Committees',
  committees_intro: 'Join one of our carefully designed committees to debate pressing international issues, develop diplomatic skills, and forge connections with fellow delegates.',
  committees_cta_title: 'Ready to Join the Deliberation?',
  committees_cta_text: 'Apply now to secure your place in one of our prestigious committees. Spaces are limited and allocated on a first-come, first-served basis.',
  committees_cta_button: 'Register as a Delegate',
  schedule_title: 'Conference Schedule',
  schedule_intro: 'Plan your TuronMUN experience with our full day programme.',
  schedule_empty_title: 'No Schedule Available',
  schedule_empty_text: 'Check back soon — the schedule will be published before the conference.',
  resources_eyebrow: 'Delegate Preparation',
  resources_title: 'Resources & Materials',
  resources_intro: 'Access comprehensive guides, background materials, and tools to help you prepare for a successful Model UN experience.',
  resources_links_title: 'Additional Resources',
  resources_links_intro: 'External links to help you prepare further.',
  resources_links: [
    { title: 'Country Research Database', description: 'Detailed information on all UN member states.', label: 'Explore', url: 'https://www.un.org/en/about-us/member-states' },
    { title: 'Resolution Templates', description: 'Download templates for drafting effective resolutions.', label: 'Download', url: 'https://www.wisemee.com/model-un-resolution-template/' },
    { title: 'Diplomatic Glossary', description: 'Essential terms and phrases used in diplomatic contexts.', label: 'View Glossary', url: 'https://www.wisemee.com/mun-glossary/' },
  ],
  awards_title: 'Award Winners',
  awards_intro: 'Celebrating the outstanding delegates of TuronMUN.',
  awards_pending_title: 'Winners announced after the conference',
  awards_pending_text: 'Award winners will be published here once the conference concludes. Stay tuned!',
  updates_title: 'Event Updates',
  updates_intro: 'Stay informed about the latest developments for TuronMUN {season}, including committee information and event schedules.',
  updates_committees_text: 'Explore the various committees that will be part of TuronMUN {season}, including topics, background guides, and committee structures.',
  updates_schedule_text: 'View the complete schedule for TuronMUN {season}, including opening and closing ceremonies, committee sessions, and social events.',
};

const contact = {
  eyebrow: 'Get In Touch',
  title: 'Contact Us',
  intro: 'Have questions about the conference? Our team is here to help you with any inquiries.',
  form_title: 'Send us a message',
  form_intro: "Fill out the form below and we'll get back to you as soon as possible.",
  venue_name: 'Central Asian Medical University (CAMU)',
  venue_text: 'TuronMUN {season} will be hosted at Central Asian Medical University (CAMU) in Fergana, Uzbekistan.',
  venue_address: 'Central Asian Medical University, Fergana, Uzbekistan',
  venue_image: '/images/camu-venue.jpg',
  faq_title: 'Frequently Asked Questions',
  faq_intro: 'Find quick answers to common questions.',
  faq: [
    { question: 'How can I apply to be a delegate?', answer: "To apply as a delegate, navigate to our Registration page and fill out the application form. You'll receive a confirmation email with further instructions." },
    { question: 'Is there a participation fee?', answer: 'Yes, there is a participation fee that varies depending on your delegation type. Early bird rates are available. Please check our Registration page for current pricing.' },
    { question: 'How can I become a committee chair?', answer: 'Committee chair applications are opened 6 months before the conference. To apply, send your CV and a motivation letter to chairs@munconference.org.' },
    { question: 'When will I know my country assignment?', answer: 'Country assignments are typically sent out 4-6 weeks after your registration is confirmed, along with committee assignments.' },
  ],
  faq_footer: "Still have questions? Don't hesitate to contact us directly.",
};

const seo = {
  site_url: 'https://www.turonmun.com',
  default_title: 'TuronMUN - Model United Nations Conference',
  default_description: 'Join TuronMUN for an enriching Model United Nations experience. Develop diplomacy, debate, and leadership skills with students from around the world.',
  keywords: 'MUN, Model United Nations, TuronMUN, Uzbekistan, Fergana, debate, diplomacy, UN, conference',
  share_image: 'https://www.turonmun.com/og-image.png',
};

const extras = {
  secret_title: 'If you found this, just know…',
  secret_lines: [
    "You're one in a million.",
    "Your smile can change someone's whole day.",
    "Never forget: you're more special than you think.",
  ],
  secret_signoff: 'Love u :)',
};

// ── Turon Debate (debat.turonmun.com) ─────────────────────────────────
const debate = {
  name: 'Turon Debate',
  intro: 'Sharpen your arguments, think on your feet and compete with debaters from across Uzbekistan. Watch the video to see how a round works, then register below.',
  video_url: '',
  video_caption: 'How a Turon Debate round works',
  register_button: 'Register',
  registration_open: true,
  registration_deadline: '',
  closed_message: 'Registration is closed right now. Follow us on Telegram for the next round.',
  info: [
    { label: 'Format', value: 'To be announced' },
    { label: 'Date', value: 'To be announced' },
    { label: 'Venue', value: 'Fergana, Uzbekistan' },
    { label: 'Participation', value: 'Free' },
  ],
  steps_title: 'How it works',
  steps: [
    { title: 'Create an account', description: 'Sign up with your email or Google account.' },
    { title: 'Register', description: 'Fill in the short registration form. You can edit it until it is reviewed.' },
    { title: 'Get confirmed', description: 'Our team reviews every registration and lets you know the result.' },
    { title: 'Debate', description: 'Prepare, show up and make your case.' },
  ],
  faq_title: 'Questions',
  faq: [] as { question: string; answer: string }[],
  cta_title: 'Ready to make your case?',
  cta_text: 'Registration takes about five minutes.',
  form_title: 'Register for Turon Debate',
  form_intro: 'Tell us a little about yourself. Fields marked * are required.',
  side_label: 'Which side would you like to be on?',
  side_hint: "We'll try to match your choice, but sides may be reassigned to balance the rounds.",
  sides: ['Affirmative', 'Opposition', 'Government', 'Parents'],
  show_side_stats: true,
  // Event day (Admin → Debate day, judges' panel)
  judging_criteria: [
    { label: 'Arguments & logic', max: 25 },
    { label: 'Rebuttal', max: 25 },
    { label: 'Speaking & presentation', max: 20 },
    { label: 'Evidence / examples', max: 15 },
    { label: 'Teamwork', max: 15 },
  ],
  reveal_teams: false,
  rules_label: 'I agree to follow the tournament rules and code of conduct.',
  success_title: 'Registration received',
  success_text: "Thank you for registering. We'll review your registration and contact you by email or Telegram.",
};

// ── Section registry ───────────────────────────────────────────────────
export const SECTIONS = {
  general: {
    key: 'general', group: 'Site', title: 'General',
    description: 'Season label, contact details, social links and logo used across the whole site.',
    defaults: general,
    fields: [
      { key: 'site_name', label: 'Site name', type: 'text' },
      { key: 'season_label', label: 'Season label', type: 'text', hint: 'Shown wherever the site says {season} — splash screen, registration, dashboards. Change it when the next season is announced.' },
      { key: 'conference_date', label: 'Conference start (date & time)', type: 'date', hint: 'Drives the countdown on the delegate dashboard. Leave empty to hide it.' },
      { key: 'logo_url', label: 'Logo', type: 'image' },
      { key: 'contact_email', label: 'Contact email', type: 'text' },
      { key: 'contact_phone', label: 'Contact phone', type: 'text' },
      { key: 'instagram_url', label: 'Instagram', type: 'url' },
      { key: 'telegram_url', label: 'Telegram', type: 'url' },
      { key: 'links_url', label: 'All-links page', type: 'url', hint: 'Shown as "Social Media" on Contact' },
      { key: 'sponsorship_url', label: 'Sponsorship contact link', type: 'url' },
      { key: 'footer_about', label: 'Footer text', type: 'textarea' },
      { key: 'footer_credits', label: 'Footer credits', type: 'text' },
      { key: 'footer_credits_url', label: 'Footer credits link', type: 'url' },
    ],
  },
  next_season: {
    key: 'next_season', group: 'Homepage', title: 'Next season card',
    description: 'The card on the right of the homepage hero.',
    defaults: next_season,
    fields: [
      { key: 'badge_label', label: 'Badge', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'date_text', label: 'Date', type: 'text' },
      { key: 'duration_text', label: 'Duration', type: 'text' },
      { key: 'location_text', label: 'Location', type: 'text' },
      { key: 'delegates_text', label: 'Delegates', type: 'text' },
      { key: 'apply_label', label: 'Apply button', type: 'text' },
    ],
  },
  hero: {
    key: 'hero', group: 'Homepage', title: 'Hero',
    defaults: hero,
    fields: [
      { key: 'eyebrow', label: 'Small label', type: 'text' },
      { key: 'phrases', label: 'Typing phrases', type: 'strings' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'apply_button', label: 'Apply button', type: 'text' },
      { key: 'committees_button', label: 'Committees button', type: 'text' },
      { key: 'accolades', label: 'Scrolling accolades', type: 'strings' },
    ],
  },
  home_about: {
    key: 'home_about', group: 'Homepage', title: 'About block',
    defaults: home_about,
    fields: [
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'headline', label: 'Headline', type: 'textarea', hint: 'Wrap words in *stars* to highlight them in gold.' },
      { key: 'paragraphs', label: 'Paragraphs', type: 'strings' },
      { key: 'stats', label: 'Stats', type: 'list', itemLabel: 'Stat', titleKey: 'label', fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'value', label: 'Number', type: 'number' },
        { key: 'suffix', label: 'Suffix', type: 'text', hint: 'e.g. +' },
      ] },
      { key: 'features', label: 'Feature cards', type: 'list', itemLabel: 'Card', titleKey: 'description', fields: titleDesc },
    ],
  },
  home_sections: {
    key: 'home_sections', group: 'Homepage', title: 'Committees, schedule & FAQ headings',
    defaults: home_sections,
    fields: [
      { key: 'committees_eyebrow', label: 'Committees — small label', type: 'text' },
      { key: 'committees_title', label: 'Committees — title', type: 'text' },
      { key: 'committees_intro', label: 'Committees — intro', type: 'textarea' },
      { key: 'committees_button', label: 'Committees — button', type: 'text' },
      { key: 'schedule_eyebrow', label: 'Schedule — small label', type: 'text' },
      { key: 'schedule_title', label: 'Schedule — title', type: 'text' },
      { key: 'schedule_intro', label: 'Schedule — intro', type: 'textarea' },
      { key: 'schedule_empty', label: 'Schedule — when empty', type: 'textarea' },
      { key: 'faq_eyebrow', label: 'FAQ — small label', type: 'text' },
      { key: 'faq_title', label: 'FAQ — title', type: 'text' },
      { key: 'faq_intro', label: 'FAQ — intro', type: 'textarea' },
    ],
  },
  faq: {
    key: 'faq', group: 'Homepage', title: 'FAQ',
    defaults: faq,
    fields: [{ key: 'items', label: 'Questions', type: 'list', itemLabel: 'Question', titleKey: 'question', fields: qa }],
  },
  sponsors: {
    key: 'sponsors', group: 'Homepage', title: 'Sponsors',
    defaults: sponsors,
    fields: [
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text', hint: 'Wrap words in *stars* to highlight them in gold.' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'logos', label: 'Sponsor logos', type: 'list', itemLabel: 'Sponsor', titleKey: 'name', fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'image', label: 'Logo', type: 'image' },
        { key: 'url', label: 'Website (optional)', type: 'url' },
      ] },
      { key: 'empty_text', label: 'Text when there are no sponsors', type: 'textarea' },
      { key: 'cta_eyebrow', label: 'Call to action — label', type: 'text' },
      { key: 'cta_text', label: 'Call to action — text', type: 'textarea' },
      { key: 'cta_button', label: 'Call to action — button', type: 'text' },
      { key: 'cta_url', label: 'Call to action — link', type: 'text', hint: 'A page like /contact or a full URL' },
    ],
  },
  about_page: {
    key: 'about_page', group: 'About page', title: 'About page',
    defaults: about_page,
    fields: [
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'primary_button', label: 'Primary button', type: 'text' },
      { key: 'secondary_button', label: 'Secondary button', type: 'text' },
      { key: 'mission_title', label: 'Mission — title', type: 'text' },
      { key: 'mission_intro', label: 'Mission — intro', type: 'textarea' },
      { key: 'mission_statement', label: 'Mission statement', type: 'textarea' },
      { key: 'values', label: 'Values', type: 'list', itemLabel: 'Value', titleKey: 'title', fields: titleDesc },
      { key: 'timeline_title', label: 'Timeline — title', type: 'text' },
      { key: 'timeline_intro', label: 'Timeline — intro', type: 'textarea' },
      { key: 'timeline', label: 'Timeline', type: 'list', itemLabel: 'Event', titleKey: 'title', fields: [
        { key: 'date', label: 'Date', type: 'text' },
        ...titleDesc,
        { key: 'milestones', label: 'Milestones', type: 'strings' },
      ] },
      { key: 'seasons_title', label: 'Seasons — title', type: 'text', hint: 'The season cards come from Past seasons.' },
      { key: 'seasons_intro', label: 'Seasons — intro', type: 'textarea' },
      { key: 'seasons_button', label: 'Seasons — button', type: 'text' },
      { key: 'testimonials_title', label: 'Testimonials — title', type: 'text' },
      { key: 'testimonials_intro', label: 'Testimonials — intro', type: 'textarea' },
      { key: 'testimonials', label: 'Testimonials', type: 'list', itemLabel: 'Testimonial', titleKey: 'author', fields: [
        { key: 'quote', label: 'Quote', type: 'textarea' },
        { key: 'author', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role', type: 'text' },
      ] },
      { key: 'gallery_title', label: 'Gallery — title', type: 'text' },
      { key: 'gallery_intro', label: 'Gallery — intro', type: 'textarea' },
      { key: 'gallery', label: 'Gallery', type: 'list', itemLabel: 'Photo', titleKey: 'caption', fields: [
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'alt', label: 'Alt text', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' },
      ] },
    ],
  },
  past_conferences: {
    key: 'past_conferences', group: 'Past seasons', title: 'Past conferences page',
    defaults: past_conferences,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'cta_title', label: '"Join us" box — title', type: 'text' },
      { key: 'cta_text', label: '"Join us" box — text', type: 'textarea' },
      { key: 'cta_button', label: '"Join us" box — button', type: 'text' },
    ],
  },
  past_seasons: {
    key: 'past_seasons', group: 'Past seasons', title: 'Seasons',
    description: 'Each season gets a page at its address and (optionally) a menu entry. Add a new one when a season ends.',
    defaults: past_seasons,
    fields: [{
      key: 'seasons', label: 'Seasons', type: 'list', itemLabel: 'Season', titleKey: 'title', fields: seasonFields,
    }],
  },
  registration: {
    key: 'registration', group: 'Pages', title: 'Registration',
    defaults: registration,
    description: 'Whether applications are open is set in Admin → Forms.',
    fields: [
      { key: 'badge_closed', label: 'Badge — closed', type: 'text' },
      { key: 'badge_open', label: 'Badge — open', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'intro_closed', label: 'Intro — closed', type: 'textarea' },
      { key: 'intro_open', label: 'Intro — open', type: 'textarea' },
      { key: 'delegate_description', label: 'Delegate card', type: 'textarea' },
      { key: 'chair_description', label: 'Chair card', type: 'textarea' },
      { key: 'observer_enabled', label: 'Show the Observer card', type: 'boolean' },
      { key: 'observer_title', label: 'Observer card — title', type: 'text' },
      { key: 'observer_description', label: 'Observer card — text', type: 'textarea' },
      { key: 'observer_url', label: 'Observer form link', type: 'url' },
      { key: 'chair_form_subtitle', label: 'Chair form subtitle', type: 'text' },
      { key: 'volunteer_form_subtitle', label: 'Volunteer form subtitle', type: 'text' },
      { key: 'signup_tip', label: 'Sign-up page tip', type: 'textarea' },
    ],
  },
  pages: {
    key: 'pages', group: 'Pages', title: 'Committees, schedule, resources, awards, updates',
    defaults: pages,
    fields: [
      { key: 'committees_badge', label: 'Committees — badge', type: 'text' },
      { key: 'committees_title', label: 'Committees — title', type: 'text' },
      { key: 'committees_intro', label: 'Committees — intro', type: 'textarea' },
      { key: 'committees_cta_title', label: 'Committees — call to action title', type: 'text' },
      { key: 'committees_cta_text', label: 'Committees — call to action text', type: 'textarea' },
      { key: 'committees_cta_button', label: 'Committees — call to action button', type: 'text' },
      { key: 'schedule_title', label: 'Schedule — title', type: 'text' },
      { key: 'schedule_intro', label: 'Schedule — intro', type: 'textarea' },
      { key: 'schedule_empty_title', label: 'Schedule — empty title', type: 'text' },
      { key: 'schedule_empty_text', label: 'Schedule — empty text', type: 'textarea' },
      { key: 'resources_eyebrow', label: 'Resources — small label', type: 'text' },
      { key: 'resources_title', label: 'Resources — title', type: 'text' },
      { key: 'resources_intro', label: 'Resources — intro', type: 'textarea' },
      { key: 'resources_links_title', label: 'Resources — external links title', type: 'text' },
      { key: 'resources_links_intro', label: 'Resources — external links intro', type: 'textarea' },
      { key: 'resources_links', label: 'Resources — external links', type: 'list', itemLabel: 'Link', titleKey: 'title', fields: [
        ...titleDesc,
        { key: 'label', label: 'Button text', type: 'text' },
        { key: 'url', label: 'Link', type: 'url' },
      ] },
      { key: 'awards_title', label: 'Awards — title', type: 'text' },
      { key: 'awards_intro', label: 'Awards — intro', type: 'textarea' },
      { key: 'awards_pending_title', label: 'Awards — before results', type: 'text' },
      { key: 'awards_pending_text', label: 'Awards — before results text', type: 'textarea' },
      { key: 'updates_title', label: 'Event updates — title', type: 'text' },
      { key: 'updates_intro', label: 'Event updates — intro', type: 'textarea' },
      { key: 'updates_committees_text', label: 'Event updates — committees card', type: 'textarea' },
      { key: 'updates_schedule_text', label: 'Event updates — schedule card', type: 'textarea' },
    ],
  },
  contact: {
    key: 'contact', group: 'Pages', title: 'Contact',
    description: 'Email, phone and social links come from General.',
    defaults: contact,
    fields: [
      { key: 'eyebrow', label: 'Small label', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'form_title', label: 'Form title', type: 'text' },
      { key: 'form_intro', label: 'Form intro', type: 'textarea' },
      { key: 'venue_name', label: 'Venue name', type: 'text' },
      { key: 'venue_text', label: 'Venue text', type: 'textarea' },
      { key: 'venue_address', label: 'Venue address', type: 'text' },
      { key: 'venue_image', label: 'Venue photo', type: 'image' },
      { key: 'faq_title', label: 'FAQ — title', type: 'text' },
      { key: 'faq_intro', label: 'FAQ — intro', type: 'textarea' },
      { key: 'faq', label: 'FAQ', type: 'list', itemLabel: 'Question', titleKey: 'question', fields: qa },
      { key: 'faq_footer', label: 'FAQ — closing line', type: 'text' },
    ],
  },
  seo: {
    key: 'seo', group: 'Site', title: 'Search & sharing',
    description: 'How the site appears on Google and when shared on Telegram/Instagram.',
    defaults: seo,
    fields: [
      { key: 'site_url', label: 'Site address', type: 'url' },
      { key: 'default_title', label: 'Default page title', type: 'text' },
      { key: 'default_description', label: 'Default description', type: 'textarea' },
      { key: 'keywords', label: 'Keywords', type: 'text' },
      { key: 'share_image', label: 'Share image', type: 'image' },
    ],
  },
  extras: {
    key: 'extras', group: 'Site', title: 'Easter egg',
    description: 'The hidden message (Ctrl + ? or the Konami code).',
    defaults: extras,
    fields: [
      { key: 'secret_title', label: 'Title', type: 'text' },
      { key: 'secret_lines', label: 'Lines', type: 'strings' },
      { key: 'secret_signoff', label: 'Sign-off', type: 'text' },
    ],
  },
  debate: {
    key: 'debate', group: 'Turon Debate', title: 'Turon Debate',
    description: 'The Turon Debate site (turonmun.com/debat): video, text, and whether registration is open. Registrations are in Admin → Turon Debate.',
    defaults: debate,
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'video_url', label: 'YouTube video link', type: 'url', hint: 'Paste the YouTube link (watch, youtu.be or shorts). Leave empty to show "Video coming soon".' },
      { key: 'video_caption', label: 'Video caption', type: 'text' },
      { key: 'register_button', label: 'Register button', type: 'text' },
      { key: 'registration_open', label: 'Registration open', type: 'boolean' },
      { key: 'registration_deadline', label: 'Registration deadline (optional)', type: 'date', hint: 'Registration closes automatically after this.' },
      { key: 'closed_message', label: 'Message when closed', type: 'textarea' },
      { key: 'info', label: 'Key details', type: 'list', itemLabel: 'Detail', titleKey: 'label', fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'value', label: 'Value', type: 'text' },
      ] },
      { key: 'steps_title', label: 'Steps — title', type: 'text' },
      { key: 'steps', label: 'Steps', type: 'list', itemLabel: 'Step', titleKey: 'title', fields: titleDesc },
      { key: 'faq_title', label: 'FAQ — title', type: 'text' },
      { key: 'faq', label: 'FAQ', type: 'list', itemLabel: 'Question', titleKey: 'question', fields: qa, hint: 'Hidden when empty.' },
      { key: 'cta_title', label: 'Closing call to action — title', type: 'text' },
      { key: 'cta_text', label: 'Closing call to action — text', type: 'text' },
      { key: 'form_title', label: 'Form — title', type: 'text' },
      { key: 'form_intro', label: 'Form — intro', type: 'textarea' },
      { key: 'side_label', label: 'Form — side question', type: 'text' },
      { key: 'side_hint', label: 'Form — side question hint', type: 'text' },
      { key: 'sides', label: 'Sides to choose from', type: 'strings', hint: "e.g. Affirmative, Opposition, Government, Parents. Leave empty to hide the question. Renaming a side doesn't change answers already given." },
      { key: 'show_side_stats', label: 'Show what share of registrations picked each side', type: 'boolean', hint: 'e.g. "17% of registrations" under each side on the form. Rejected registrations are not counted.' },
      { key: 'rules_label', label: 'Form — rules checkbox', type: 'text' },
      { key: 'judging_criteria', label: 'Judging criteria', type: 'list', itemLabel: 'Criterion', titleKey: 'label', hint: "Used on the judges' score sheets. Renaming a criterion after judging has started drops the points already given for it.", fields: [
        { key: 'label', label: 'Criterion', type: 'text' },
        { key: 'max', label: 'Points', type: 'number' },
      ] },
      { key: 'reveal_teams', label: 'Show teams to debaters', type: 'boolean', hint: "Accepted debaters see their team, position and one-on-one opponent on their registration page." },
      { key: 'success_title', label: 'After registering — title', type: 'text' },
      { key: 'success_text', label: 'After registering — text', type: 'textarea' },
    ],
  },
} satisfies Record<string, Section<any>>;

export type SectionKey = keyof typeof SECTIONS;
export type ContentMap = { [K in SectionKey]: (typeof SECTIONS)[K]['defaults'] };
export const SECTION_LIST: Section[] = Object.values(SECTIONS) as Section[];
