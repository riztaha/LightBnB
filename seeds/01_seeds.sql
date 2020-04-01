INSERT INTO users (name, email, password)
VALUES ('Taha Rizvi', 'riztaha@gmail.com', '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.'),
('Bob Ross', 'bross@hotmail.com', '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.'),
('Timmy Turner', 'timzt@gmail.com', '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.');

INSERT INTO properties
(owner_id, title, description, thumbnail_photo_url, cover_photo_url,
cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms,
country, street, city, province, post_code, active)
VALUES
(1, 'TT House', 'TT home description', 'TT_thumbnail_url',
'TT_cover_url', 152395.99, 7, 12, 9, 'Canada', '23 Brooklyn St', 'Toronto', 'ON',
'M2W 5S0', 'true'),
(2, 'Ross Rez', 'Rez description', 'rez_thumbnail_url',
'rez_cover_url', 100.00, 1, 1, 2, 'Canada', '2415 Street Ave', 'Barrie', 'ON',
'Q2P 5S7', 'true'),
(3, 'Timmy Wizardly Home', 'WizHome description', 'wizhome_thumbnail_url',
'wizhome_cover_url', 49215.15, 20, 150, 1000, 'China', '22 Ontario St', 'Wuhan', 'Hubei',
'215962195', 'true');

INSERT INTO reservations (start_date, end_date, property_id, guest_id)
VALUES ('2020-01-01', '2020-01-07', 1, 3), ('2019-12-20', '2019-12-27', 1, 2),
('2020-02-04', '2020-03-04', 2, 1), ('2020-03-15', '2020-04-01', 3, 2);

INSERT INTO property_reviews (guest_id, property_id, reservation_id, rating, message)
VALUES (3, 1, 1, 5, 'messages'), (2, 1, 2, 5, 'messages'), (1, 2, 3, 4, 'messages'), (2, 3, 4, 2, 'messages');