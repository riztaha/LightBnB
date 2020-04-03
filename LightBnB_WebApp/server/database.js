const db = require("./db");

//////////////////////////////////////
/// ----------- Users ----------- ///
////////////////////////////////////

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT * FROM users
  WHERE email = $1;
  `;
  return db
    .query(queryString, [email])
    .then(res => {
      if (res.rows) {
        return res.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => {
      console.log("error:", err);
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT id, name, email FROM users
  WHERE id = $1;
  `;
  return db
    .query(queryString, [id])
    .then(res => {
      if (res.rows) {
        return res.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => console.log("error:", err));
};

exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const queryString = `
  INSERT INTO users (name, password, email)
  VALUES ($1, $2, $3)
  RETURNING *;
  `;
  const queryParams = [user["name"], user["password"], user["email"]];
  return db
    .query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(error => {
      console.log("error:", error);
    });
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
  const queryString = `
  SELECT reservations.*, properties.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id 
  JOIN property_reviews ON property_reviews.reservation_id = reservations.id
  WHERE reservations.guest_id = $1 AND end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY start_date
  LIMIT $2;
  `;
  const queryParams = [guest_id, limit];
  return db
    .query(queryString, queryParams)
    .then(res => res.rows)
    .catch(error => {
      console.log(error);
    });
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
  FULL JOIN property_reviews ON properties.id = property_id
  `;

  // If the user clicks 'My Listings' then the page will set to view all the listings of the id that is
  // logged in with the following code:
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }
  // Only add 'WHERE' clause if options has some values, will need to remove this from owner_id because
  // it will get added to the end of owner_id
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

  // IF The query ends in a WHERE, remove it as well:
  // This is needed for 2 reasons. The owner_id gets a WHERE added to it by default, it
  // needs to be removed. Also because if the search does not have anything except
  // a rating, the WHERE will need to be removed.
  if (queryString.endsWith("WHERE ")) {
    queryString = queryString.slice(0, -6);
  }

  // If there is a rating search, the PostgreSQL query will require a HAVING in it.
  // Remember, HAVING occurs after the GROUP:
  queryString += `
  GROUP BY properties.id
  `;

  // If the query doesn't have any other search, except for a minimum rating,
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
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

  return db
    .query(queryString, queryParams)
    .then(res => res.rows)
    .catch(error => {
      console.log(error);
    });
};

exports.getAllProperties = getAllProperties;

/////////////////////////////////////////////
/// ----------- Add Property ----------- ///
///////////////////////////////////////////

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryString = `
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url,
    cover_photo_url, cost_per_night, street, city, province, post_code, country,
    parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
    `;
  const queryParams = [
    property["owner_id"],
    property["title"],
    property["description"],
    property["thumbnail_photo_url"],
    property["cover_photo_url"],
    property["cost_per_night"],
    property["street"],
    property["city"],
    property["province"],
    property["post_code"],
    property["country"],
    property["parking_spaces"],
    property["number_of_bathrooms"],
    property["number_of_bedrooms"]
  ];

  console.log("Query String ------>", queryString);
  console.log("Query Params ------>", queryParams);

  return db
    .query(queryString, queryParams)
    .then(res => res.rows[0])
    .catch(error => {
      console.log(error);
    });
};

exports.addProperty = addProperty;
