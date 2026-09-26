-- 1. Clear old data
DELETE FROM registrations;
DELETE FROM events;

-- 2. Seed Events using Dynamic Time Math
-- No matter when you run this, you will always get a perfect mix of past and future events.
INSERT INTO events (id, organization_id, organizer_id, name, description, date, venue, category, capacity, status, metadata) VALUES
-- UPCOMING EVENTS (Future)
('evt-01', 'org-club-1', 'org-1', 'Hack the Campus 2026', 'A 24-hour overnight hackathon open to all branches.', NOW() + INTERVAL '18 days', 'Innovation Lab, Block C', 'Tech', 120, 'published', '{"requirements": ["Laptop"]}'),
('evt-02', 'org-club-2', 'org-1', 'Acoustic Nights: Open Mic', 'Sign up to sing, play, or read poetry.', NOW() + INTERVAL '9 days', 'Amphitheatre Lawn', 'Music', 80, 'published', '{}'),
('evt-03', 'org-club-4', 'org-1', 'Resume & LinkedIn Clinic', 'Drop-in session with alumni volunteers.', NOW() + INTERVAL '6 days', 'Placement Cell, Admin Block', 'Career', 40, 'published', '{}'),
('evt-05', 'org-club-1', 'org-1', 'Intro to Figma Workshop', 'A hands-on beginner workshop covering frames.', NOW() + INTERVAL '24 days', 'Design Studio, Block B', 'Workshop', 30, 'published', '{"software_needed": "Figma"}'),
('evt-06', 'org-club-2', 'org-1', 'Diwali Mela', 'Stalls, rangoli competitions, and a light show.', NOW() + INTERVAL '46 days', 'Central Quad', 'Cultural', 500, 'published', '{}'),
('evt-08', 'org-club-3', 'org-1', 'Basketball 3x3 Street League', 'Casual weekly 3x3 basketball league.', NOW() + INTERVAL '14 days', 'Outdoor Courts', 'Sports', 64, 'published', '{}'),
('evt-09', 'org-club-4', 'org-1', 'Startup Pitch Day', 'Student founders pitch to alumni investors.', NOW() + INTERVAL '32 days', 'Auditorium', 'Career', 200, 'published', '{"dress_code": "Formal"}'),
('evt-11', 'org-club-2', 'org-1', 'Classical Fusion Night', 'Carnatic and Hindustani classical forms.', NOW() + INTERVAL '39 days', 'Amphitheatre Lawn', 'Music', 150, 'published', '{}'),
('evt-14', 'org-club-1', 'org-1', 'Cloud & DevOps Study Group', 'First meetup of a semester-long study group.', NOW() + INTERVAL '13 days', 'Computer Science Lab 1', 'Workshop', 45, 'published', '{}'),
('evt-15', 'org-club-3', 'org-1', 'Badminton Doubles Tournament', 'Open doubles tournament, singles-elimination.', NOW() + INTERVAL '26 days', 'Indoor Sports Complex', 'Sports', 32, 'published', '{}'),

-- PAST EVENTS (Completed)
('evt-04', 'org-club-3', 'org-1', 'Inter-Hostel Football Cup — Final', 'The championship match.', NOW() - INTERVAL '11 days', 'Main Sports Ground', 'Sports', 300, 'completed', '{}'),
('evt-10', 'org-club-2', 'org-1', 'Photography Walk: Old Campus', 'A guided golden-hour photo walk.', NOW() - INTERVAL '15 days', 'Meet at Main Gate', 'Workshop', 25, 'completed', '{}'),
('evt-12', 'org-club-1', 'org-1', 'Data Structures Doubt-Clearing', 'Pre-exam doubt-clearing session.', NOW() - INTERVAL '19 days', 'Lecture Hall 4', 'Tech', 90, 'completed', '{}'),
('evt-13', 'org-club-3', 'org-1', 'Freshers'' Orientation Games', 'Icebreaker games and campus scavenger hunt.', NOW() - INTERVAL '8 days', 'Central Quad', 'Cultural', 250, 'completed', '{}'),

-- CANCELLED EVENT (Future date, but cancelled status)
('evt-07', 'org-club-1', 'org-1', 'Competitive Programming Bootcamp', 'Three-hour bootcamp on graph algorithms.', NOW() + INTERVAL '2 days', 'Computer Science Lab 2', 'Tech', 60, 'cancelled', '{}');

-- 3. Seed Registrations (Relative to the new dynamic events)
-- stu-1 has 1 upcoming, 1 past, and 1 waitlisted (we will use waitlist in the next step!)
INSERT INTO registrations (id, event_id, student_id, status, created_at) VALUES
('reg-01', 'evt-01', 'stu-1', 'confirmed', NOW() - INTERVAL '6 days'),  -- Upcoming Hackathon
('reg-02', 'evt-04', 'stu-1', 'attended', NOW() - INTERVAL '15 days'), -- Past Football match
('reg-03', 'evt-09', 'stu-1', 'confirmed', NOW() - INTERVAL '4 days');  -- Upcoming Pitch Day
