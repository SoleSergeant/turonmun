-- SQL Script to insert a test application for Country Matrix testing
-- Run this in your Supabase SQL Editor

INSERT INTO applications (
    full_name,
    email,
    phone,
    institution,
    country,
    experience,
    committee_preference1,
    committee_preference2,
    committee_preference3,
    motivation,
    status,
    payment_status,
    has_ielts,
    has_sat,
    notes
) VALUES (
    'Test Delegate',
    'delegate@test.com',
    '+998901234567',
    'Test University',
    'Uzbekistan, Tashkent',
    '3-5', -- Experience level
    'United Nations General Assembly', -- Make sure this matches a real committee name
    'World Trade Organization',
    'Human Rights Council',
    'I am very motivated to join this conference to discuss global issues.',
    'approved', -- Status 'approved' so it shows up in Country Matrix
    'paid',
    true,
    false,
    'Previous MUNs: Best Delegate at TASHMUN\nPortfolio: https://linkedin.com/in/test'
);

-- Verify the insertion
SELECT id, full_name, status, country FROM applications WHERE email = 'delegate@test.com';
