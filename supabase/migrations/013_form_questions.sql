-- form_questions: stores the full configurable question list for each form.
-- Each element describes one field rendered in the public registration form.
-- system=true questions can be hidden/edited but not deleted by the admin.
-- widget field handles special rendering (committee_select, photo_upload).

ALTER TABLE public.form_settings
  ADD COLUMN IF NOT EXISTS form_questions JSONB NOT NULL DEFAULT '[]';

-- Seed default questions for the delegate form
UPDATE public.form_settings
SET form_questions = '[
  {"id":"p1_fullName",       "step":1,"order":1,"name":"fullName",              "label":"Full Name",                                            "type":"text",    "placeholder":"Enter your full name",                                                      "helpText":null,                                              "required":true, "visible":true,"system":true},
  {"id":"p1_email",          "step":1,"order":2,"name":"email",                 "label":"Email Address",                                        "type":"email",   "placeholder":null,                                                                        "helpText":"Taken from your account — cannot be changed",     "required":true, "visible":true,"system":true,"readonly":true},
  {"id":"p1_telegram",       "step":1,"order":3,"name":"telegramUsername",      "label":"Telegram Username",                                    "type":"text",    "placeholder":"e.g., @username",                                                           "helpText":"Format hint (e.g., @username)",                   "required":true, "visible":true,"system":true},
  {"id":"p1_institution",    "step":1,"order":4,"name":"institution",           "label":"Institution of Study or Workplace",                    "type":"text",    "placeholder":"School, university, or workplace",                                          "helpText":"Accept both school/university or job place",      "required":true, "visible":true,"system":true},
  {"id":"p1_dob",            "step":1,"order":5,"name":"dateOfBirth",           "label":"Date of Birth",                                        "type":"date",    "placeholder":null,                                                                        "helpText":"Format: MM/DD/YYYY",                              "required":true, "visible":true,"system":true},
  {"id":"p1_country",        "step":1,"order":6,"name":"countryAndCity",        "label":"Country and City",                                     "type":"text",    "placeholder":"Country, City",                                                             "helpText":"Format: Country, City",                          "required":true, "visible":true,"system":true},
  {"id":"p1_phone",          "step":1,"order":7,"name":"phone",                 "label":"Contact Phone Number",                                 "type":"tel",     "placeholder":"Enter your phone number",                                                   "helpText":null,                                              "required":false,"visible":true,"system":true},
  {"id":"p1_photo",          "step":1,"order":8,"name":"photo",                 "label":"Profile Photo",                                        "type":"file",    "placeholder":null,                                                                        "helpText":"Upload a clear, recent photo",                    "required":false,"visible":true,"system":true,"widget":"photo_upload"},

  {"id":"p2_experience",     "step":2,"order":1,"name":"experience",            "label":"MUN Experience Level",                                 "type":"select",  "placeholder":"Select your experience level",                                              "helpText":"Used to gauge experience and balance delegation", "required":true, "visible":true,"system":true,"options":["None","1-2","3-5","6+"]},
  {"id":"p2_prevMUNs",       "step":2,"order":2,"name":"previousMUNs",         "label":"List previous MUNs and awards (if any)",               "type":"textarea","placeholder":"Names of conferences, awards, roles — helps evaluate track record and dedication","helpText":"Names of conferences, awards, roles",              "required":false,"visible":true,"system":true},

  {"id":"p3_comm1",          "step":3,"order":1,"name":"committee_preference1", "label":"First Committee Preference",                           "type":"select",  "placeholder":"Select your first choice",                                                  "helpText":"We will do our best to match your top choice",    "required":true, "visible":true,"system":true,"widget":"committee_select"},
  {"id":"p3_comm2",          "step":3,"order":2,"name":"committee_preference2", "label":"Second Committee Preference",                          "type":"select",  "placeholder":"Select your second choice",                                                 "helpText":null,                                              "required":true, "visible":true,"system":true,"widget":"committee_select"},
  {"id":"p3_comm3",          "step":3,"order":3,"name":"committee_preference3", "label":"Third Committee Preference",                           "type":"select",  "placeholder":"Select your third choice",                                                  "helpText":null,                                              "required":true, "visible":true,"system":true,"widget":"committee_select"},

  {"id":"p4_issueInterest",  "step":4,"order":1,"name":"issueInterest",         "label":"A topic or issue you are passionate or knowledgeable about","type":"textarea","placeholder":"Pick an issue or theme you would dive into for hours. Tell us why it grips you.",  "helpText":"Pick an issue or theme you would dive into for hours.", "required":true,"visible":true,"system":true}
]'
WHERE form_type = 'delegate';

-- Seed for chair form (simpler — no fee questions)
UPDATE public.form_settings
SET form_questions = '[
  {"id":"c1_fullName",       "step":1,"order":1,"name":"fullName",              "label":"Full Name",                                            "type":"text",    "placeholder":"Enter your full name",                                                      "helpText":null,                                              "required":true, "visible":true,"system":true},
  {"id":"c1_email",          "step":1,"order":2,"name":"email",                 "label":"Email Address",                                        "type":"email",   "placeholder":null,                                                                        "helpText":"Taken from your account",                         "required":true, "visible":true,"system":true,"readonly":true},
  {"id":"c1_telegram",       "step":1,"order":3,"name":"telegramUsername",      "label":"Telegram Username",                                    "type":"text",    "placeholder":"e.g., @username",                                                           "helpText":"Format hint (e.g., @username)",                   "required":true, "visible":true,"system":true},
  {"id":"c1_institution",    "step":1,"order":4,"name":"institution",           "label":"Institution of Study or Workplace",                    "type":"text",    "placeholder":"School, university, or workplace",                                          "helpText":null,                                              "required":true, "visible":true,"system":true}
]'
WHERE form_type = 'chair';
