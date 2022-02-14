const express = require("express");
const { getAllRestaurants } = require("../controller/controller");
const { Restaurant, Type, User, Review, Reserve } = require("../db");

const router = express.Router();

//Traigo todos los restaurants y los cargo en la DB
router.get("/", async (req, res) => {
  const { name } = req.query;
  const allRestaurants = await getAllRestaurants();
  // console.log(allRestaurants);
  try {
    if (name) {
      let restaurant = allRestaurants.filter((e) =>
        e.name.toLowerCase().includes(name.toLowerCase())
      );
      restaurant.length
        ? res.status(200).send(restaurant)
        : res.status(404).json({ message: "Restaurant no encontrado" });
    } else {
      return res.status(200).send(allRestaurants);
    }
  } catch (e) {
    return res.status(404).json({ message: "Petición inválida" });
  }
});

//Traigo un restaurant por ID para el detalle completo
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const allRestaurants = await getAllRestaurants();
  try {
    if (id) {
      let restaurant = allRestaurants.find((e) => e.id == id);
      restaurant
        ? res.status(200).send(restaurant)
        : res.status(404).json({ message: "Restaurant no encontrado" });
    }
  } catch (e) {
    return res.status(404).json({ message: "Petición inválida" });
  }
});

//Creo una reserva
router.post("/:id/reserves", async (req, res) => {
  //email de usuario, date, time y pax de reserve, id de restaurant
  const { id } = req.params;
  const { email, date, time, pax } = req.body;

  try {
    if (email && date && time && pax && id) {
      const restaurant = await Restaurant.findOne({
        where: {
          id,
        },
      });
      //   console.log(restaurant.dataValues);

      const user = await User.findOne({
        where: {
          email,
        },
      });
      //   console.log(user.dataValues);

      if (restaurant && user) {
        // console.log(restaurant);
        // console.log(user);
        if (user.email !== "API") {
          if (restaurant.dataValues.personas_max >= pax) {
            //Mercadopago
            const reserve = await Reserve.create({
              date,
              time,
              pax,
              status: "IN PROGRESS",
              author: user.dataValues.username,
              UserId: user.dataValues.id,
              RestaurantId: restaurant.dataValues.id,
            });
            await Restaurant.update(
              {
                personas_max: restaurant.dataValues.personas_max - pax,
              },
              {
                where: {
                  id: restaurant.dataValues.id,
                },
              }
            );
            // console.log(restaurant.dataValues);
            return res.status(200).send(reserve);
          } else {
            return res.status(400).json({
              message: `Solo nos quedan ${restaurant.dataValues.personas_max} lugares disponibles`,
            });
          }
        } else {
          return res.status(400).json({
            message: 'No se le pueden hacer reservas a este Restaurant',
          });
        }
      } else {
        return res
          .status(400)
          .json({ message: "Usuario/Restaurant no existe" });
      }
    } else {
      return res.status(400).json({ message: "Faltan rellenar campos" });
    }
  } catch (e) {
    return res.status(404).send({ message: "Petición inválida" });
  }
});

//Traigo todas las reservas de un restaurant
router.get("/:id/reserves", async (req, res) => {
  //id de restaurant
  const { id } = req.params;

  try {
    if (id) {
      const reserves = await Reserve.findAll({
        where: {
          RestaurantId: id,
        },
      });
      if (reserves.length) {
        // console.log(reserves);
        return res.status(200).send(reserves);
      } else {
        return res.status(200).json({
          message: "El restaurant no tiene reservas para los próximos días",
        });
      }
    } else {
      return res.status(400).json({
        message: "Hace falta el ID del restaurant para encontrar sus reservas",
      });
    }
  } catch (e) {
    return res.status(400).json({ message: "Petición inválida" });
  }
});

//Creo un review de un restaurant
router.post("/:id/reviews", async(req, res) => {
  const { id } = req.params;
  const { email, rating, description } = req.body;

  try {
    if (email && rating && description && id) {
      if (rating === '1' || rating === '2' || rating === '3' || rating === '4' || rating === '5') {
        const restaurant = await Restaurant.findOne({
          where: {
            id,
          },
        });
        //   console.log(restaurant[0].dataValues);
  
        const user = await User.findOne({
          where: {
            email,
          },
        });
        //   console.log(user[0].dataValues);
  
        if (restaurant && user) {
          const review = await Review.create({
            rating,
            description,
            user: user.dataValues.username,
            restaurant: restaurant.dataValues.name,
            UserId: user.dataValues.id,
            RestaurantId: restaurant.dataValues.id,
          });
          // console.log(review);
          return res.status(200).send(review);
        } else {
          return res
            .status(400)
            .json({ message: "Usuario/Restaurant no existe" });
        }
      } else {
        return res.status(400).json({ message: "El rating debe ser un número entero entre 1 y 5" });
      }


    } else {
      return res.status(400).json({ message: "Datos incompletos" });
    }
  } catch (e) {
    return res.status(400).json({ message: "Petición inválida" });
  }
});

//Traigo todas las review de un restaurant
router.get("/:id/reviews", async (req, res) => {
  //id de restaurant
  const { id } = req.params;

  try {
    if (id) {
      const reviews = await Review.findAll({
        where: {
          RestaurantId: id,
        },
      });
      if (reviews.length) {
        // console.log(reviews);
        return res.status(200).send(reviews);
      } else {
        return res
          .status(200)
          .json({ message: "El restaurant no tiene reseñas para mostrar" });
      }
    } else {
      return res.status(400).json({
        message: "Hace falta el ID del restaurant para encontrar sus reseñas",
      });
    }
  } catch (e) {
    return res.status(400).json({ message: "Petición inválida" });
  }
});

//Creo un restaurant
router.post("/", async (req, res) => {
  const {
    name,
    address,
    neighborhood_info,
    cuisine,
    email,
    personas_max,
    photo,
    description,
    price,
    owner,
  } = req.body;
  try {
    if (name && email) {
      const allRestaurants = await getAllRestaurants();
      const restaurantName = allRestaurants.filter(
        (e) => e.name?.toLowerCase() === name?.toLowerCase()
      );
      const restaurantEmail = allRestaurants.filter(
        (e) => e.email?.toLowerCase() === email?.toLowerCase()
      );

      const userFind = await User.findOne({
        where: {
          email: owner,
        },
      });

      if (userFind) {
        if (!restaurantName.length && !restaurantEmail.length) {
          const restaurant = await Restaurant.create({
            name,
            address,
            neighborhood_info,
            cuisine,
            email,
            personas_max,
            photo,
            description,
            price,
            owner,
          });

          const cuisinesType = await Type.findAll({
            where: {
              name: cuisine,
            },
          });

          restaurant.addType(cuisinesType);
          return res.status(201).send(restaurant);
        } else {
          return res
            .status(406)
            .json({ message: "El nombre del restaurant o su email ya existe" });
        }
      } else {
        return res.status(404).json({ message: "Debes estar registrado para poder crear un restaurant" })
      }
    }
    if (
      !name ||
      !address ||
      !neighborhood_info ||
      !cuisine ||
      !email ||
      !personas_max
    ) {
      return res.status(400).json({ message: "Información incompleta" });
    }
  } catch (e) {
    return res.status(404).json({ message: "Petición inválida" });
  }
});

//Modifico datos del restaurant existente
router.put("/:id", async (req, res) => {
  //id de restaurant, email de usuario loggeado
  const { id } = req.params;

  const {
    owner,
    name,
    address,
    rating,
    neighborhood_info,
    cuisine,
    email,
    personas_max,
    photo,
    description,
    price,
  } = req.body;

  try {
    const restaurant = await Restaurant.findOne({
      where: {
        id,
        owner,
      },
    });
    if (restaurant) {
      const newRestaurant = await restaurant.update(
        {
          name: name ? name : restaurant.dataValues.name,
          address: address ? address : restaurant.dataValues.address,
          rating: rating ? rating : restaurant.dataValues.rating,
          neighborhood_info: neighborhood_info
            ? neighborhood_info
            : restaurant.dataValues.neighborhood_info,
          cuisine: cuisine ? cuisine : restaurant.dataValues.cuisine,
          email: email ? email : restaurant.dataValues.email,
          personas_max: personas_max
            ? personas_max
            : restaurant.dataValues.personas_max,
          photo: photo ? (restaurant.dataValues.photo.concat(photo)) : restaurant.dataValues.photo,
          description: description
            ? description
            : restaurant.dataValues.description,
          price: price ? price : restaurant.dataValues.price,
        },
        {
          where: {
            id,
          },
        }
      );
      res.status(200).send(newRestaurant);
    } else {
      res.status(400).json({
        message: "Solo el dueño puede modificar los datos del restaurant",
      });
    }
  } catch (e) {
    res.status(404).json({ message: "Petición inválida" });
  }
});

//Elimino restaurant
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findOne({
      where: {
        id,
      },
    });

    // console.log('Soy restaurant', restaurant);
    if (restaurant) {
      await restaurant.destroy();
      return res
        .status(200)
        .json({ message: "Restaurant eliminado con éxito" });
    }
    return res
      .status(400)
      .json({ message: "Solo el dueño puede eliminar el restaurant" });
  } catch (e) {
    return res.status(404).json({ message: "Petición inválida" });
  }
});

module.exports = router;
