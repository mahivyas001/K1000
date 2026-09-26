-- 1. Seed Organizations
INSERT INTO organizations (id, name, slug, description) VALUES
('org-club-1', 'Tech Society', 'tech-society', 'The premier tech club on campus.'),
('org-club-2', 'Cultural Committee', 'cultural-committee', 'Organizing arts, music, and festivals.'),
('org-club-3', 'Sports Board', 'sports-board', 'Managing all inter-hostel and intramural sports.'),
('org-club-4', 'E-Cell', 'e-cell', 'Entrepreneurship development cell.')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Users (Only students and organizers)
INSERT INTO users (id, name, email, role) VALUES
('stu-1', 'Aditi Rao', 'aditi@campus.edu', 'student'),
('org-1', 'Rohan Verma', 'rohan@campus.edu', 'organizer')
ON CONFLICT (id) DO NOTHING;

-- 3. Link Organizers to Clubs
INSERT INTO organization_members (organization_id, user_id, role) VALUES
('org-club-1', 'org-1', 'owner'),
('org-club-2', 'org-1', 'member'),
('org-club-4', 'org-1', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Seed Events 
INSERT INTO events (id, organization_id, organizer_id, name, description, date, venue, category, capacity, status, metadata) VALUES
('evt-01', 'org-club-1', 'org-1', 'Hack the Campus 2026', 'A 24-hour overnight hackathon open to all branches. Teams of up to 4 build anything that makes campus life better.', '2026-10-04T18:00:00Z', 'Innovation Lab, Block C', 'Tech', 120, 'published', '{"requirements": ["Laptop"]}'),
('evt-02', 'org-club-2', 'org-1', 'Acoustic Nights: Open Mic', 'Sign up to sing, play, or read poetry. No audition needed.', '2026-09-25T19:30:00Z', 'Amphitheatre Lawn', 'Music', 80, 'published', '{}'),
('evt-03', 'org-club-4', 'org-1', 'Resume & LinkedIn Clinic', 'Drop-in session with alumni volunteers.', '2026-09-22T14:00:00Z', 'Placement Cell, Admin Block', 'Career', 40, 'published', '{}'),
('evt-04', 'org-club-3', 'org-1', 'Inter-Hostel Football Cup — Final', 'The championship match of this year''s Inter-Hostel Football Cup.', '2026-09-05T16:00:00Z', 'Main Sports Ground', 'Sports', 300, 'completed', '{}'),
('evt-05', 'org-club-1', 'org-1', 'Intro to Figma Workshop', 'A hands-on beginner workshop covering frames, components, and prototyping.', '2026-10-10T15:00:00Z', 'Design Studio, Block B', 'Workshop', 30, 'published', '{"software_needed": "Figma"}'),
('evt-06', 'org-club-2', 'org-1', 'Diwali Mela', 'Stalls, rangoli competitions, and a fireworks-free light show.', '2026-11-01T17:00:00Z', 'Central Quad', 'Cultural', 500, 'published', '{}'),
('evt-07', 'org-club-1', 'org-1', 'Competitive Programming Bootcamp', 'Three-hour bootcamp on graph algorithms and dynamic programming.', '2026-09-10T10:00:00Z', 'Computer Science Lab 2', 'Tech', 60, 'cancelled', '{}'),
('evt-08', 'org-club-3', 'org-1', 'Basketball 3x3 Street League', 'Casual weekly 3x3 basketball league.', '2026-09-30T17:30:00Z', 'Outdoor Courts', 'Sports', 64, 'published', '{}'),
('evt-09', 'org-club-4', 'org-1', 'Startup Pitch Day', 'Student founders pitch to a panel of alumni investors.', '2026-10-18T13:00:00Z', 'Auditorium', 'Career', 200, 'published', '{"dress_code": "Formal"}'),
('evt-10', 'org-club-2', 'org-1', 'Photography Walk: Old Campus', 'A guided golden-hour photo walk through the older parts of campus.', '2026-09-01T17:00:00Z', 'Meet at Main Gate', 'Workshop', 25, 'completed', '{}'),
('evt-11', 'org-club-2', 'org-1', 'Classical Fusion Night', 'The Music Society blends Carnatic and Hindustani classical forms.', '2026-10-25T19:00:00Z', 'Amphitheatre Lawn', 'Music', 150, 'published', '{}'),
('evt-12', 'org-club-1', 'org-1', 'Data Structures Doubt-Clearing Marathon', 'Pre-exam doubt-clearing session covering trees, heaps, and hashing.', '2026-08-28T11:00:00Z', 'Lecture Hall 4', 'Tech', 90, 'completed', '{}'),
('evt-13', 'org-club-3', 'org-1', 'Freshers'' Orientation Games', 'Icebreaker games and campus scavenger hunt for the incoming batch.', '2026-09-08T09:30:00Z', 'Central Quad', 'Cultural', 250, 'completed', '{}'),
('evt-14', 'org-club-1', 'org-1', 'Cloud & DevOps Study Group Kickoff', 'First meetup of a semester-long study group covering AWS fundamentals.', '2026-09-29T18:00:00Z', 'Computer Science Lab 1', 'Workshop', 45, 'published', '{}'),
('evt-15', 'org-club-3', 'org-1', 'Badminton Doubles Tournament', 'Open doubles tournament, singles-elimination bracket.', '2026-10-12T08:00:00Z', 'Indoor Sports Complex', 'Sports', 32, 'published', '{}')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Registrations (For stu-1)
INSERT INTO registrations (id, event_id, student_id, status, created_at) VALUES
('reg-01', 'evt-01', 'stu-1', 'confirmed', '2026-09-10T10:15:00Z'),
('reg-02', 'evt-04', 'stu-1', 'attended', '2026-08-20T09:00:00Z'),
('reg-03', 'evt-09', 'stu-1', 'confirmed', '2026-09-12T18:40:00Z')
ON CONFLICT (id) DO NOTHING;
