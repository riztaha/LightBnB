SELECT properties.id, title, cost_per_night, number_of_bedrooms, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON property_id = properties.id
WHERE city like '%Vancouver%'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
ASC LIMIT 10;