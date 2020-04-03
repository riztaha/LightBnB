const { Pool } = require("pg");

// Connecting to the lightbnb database.
const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb"
});

const properties = require("./json/properties.json");
const users = require("./json/users.json");

//////////////////////////////////////
/// ----------- Users ----------- ///
////////////////////////////////////

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(
      `
  SELECT * FROM users
  WHERE email = $1;
  `,
      [email]
    )
    .then(res => res.rows[0])
    .catch(res => null);
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(
      `
  SELECT id, name, email FROM users
  WHERE id = $1;
  `,
      [id]
    )
    .then(res => res.rows[0])
    .catch(res => null);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool
    .query(
      `
  INSERT INTO users (name, password, email)
  VALUES ($1, $2, $3)
  RETURNING *;
  `,
      [user["name"], user["password"], user["email"]]
    )
    .then(res => res.rows[0])
    .catch(res => err);
};
exports.addUser = addUser;

/////////////////////////////////////////////
/// ----------- Reservations ----------- ///
///////////////////////////////////////////

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(
      `
  SELECT reservations.*, properties.*, avg(rating) as average_rating FROM
  reservations
  JOIN properties ON reservations.property_id = properties.id 
  JOIN property_reviews ON property_reviews.reservation_id = reservations.id
  WHERE reservations.guest_id = $1 AND end_date < now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY start_date
  LIMIT $2;
  `,
      [guest_id, limit]
    )
    .then(res => res.rows)
    .catch(err => err);
};
exports.getAllReservations = getAllReservations;

///////////////////////////////////////////
/// ----------- Properties ----------- ///
/////////////////////////////////////////

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  // 2 - Start the query with all information that comes before the WHERE clause.
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // Only add 'WHERE' clause if options has some values
  if (Object.values(options).join("")) {
    queryString += `WHERE `;
  }
  // Check if a city has been passed in as an option. Add the city to the params array and create a WHERE clause for the city.
  // We can use the length of the array to dynamically get the $n placeholder number. Since this is the first parameter, it will be $1.
  // The % syntax for the LIKE clause must be part of the parameter, not the query.
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `city LIKE $${queryParams.length} AND `;
  }

  // If the user clicks 'My Listings' then the page will set to view all the listings of the id that is
  // logged in with the following code:
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `owner_id = $${queryParams.length} AND `;
  }

  // If there is only a minimum price and no max price, then query to find properties matching the min price.
  // * 100 because all prices are in cents, user can input 12 to find properties
  // with min cost of $12/night instead of having them type 1200 to return 1200 pennies/night
  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night) * 100);
    queryString += `cost_per_night >= $${queryParams.length} AND `;
  }

  // If there is only a max price and no min price then only the max price query will run:
  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night) * 100);
    queryString += `cost_per_night <= $${queryParams.length} AND `;
  }

  // Get rid of last 'AND' if it exists in the query:
  if (queryString.endsWith(" AND ")) {
    queryString = queryString.slice(0, -5);
  }

  // If there is a rating search, the SQL query will require a HAVING in it.
  // Remember, HAVING occurs  after the GROUP:
  queryString += `
  GROUP BY properties.id`;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  // The rest of the query can be passed:
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  ASC LIMIT $${queryParams.length};
  `;

  // 5 - Console log everything just to make sure we've done it right.
  console.log("String--->", queryString, "Params ---->", queryParams);
  console.log("options ------>", options);

  return pool
    .query(queryString, queryParams)
    .then(res => res.rows)
    .catch(error => {
      console.log(error);
    });
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
