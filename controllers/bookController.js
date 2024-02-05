
const Book = require("../models/bookModel");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    // Validation des données d'entrée
    if (!bookObject) {
      throw new Error("Données de livre invalides");
    }
    // suppression de l'id livre envoyé par le front
    delete bookObject._id;
    // suppression de l'userid envoyé par le front par mesure de sécurité
    delete bookObject._userId;
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    });

    book.save()
      .then(() => {
        res.status(201).json({ message: "Book enregistré" });
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getBestrating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

exports.modifyBook = async (req, res, next) => {
  try {
    let bookObject = req.body;
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérification de l'utilisateur autorisé à modifier le livre
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Erreur d'autorisation" });
    }

    if (req.file) {
      bookObject.imageUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;

      // Suppression de l'ancienne image si elle existe
      if (book.imageUrl) {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, (error) => {
          if (error) {
            console.error("Erreur lors de la suppression de l'image du livre:", error);
          }
        });
      }
    }

    // Mise à jour du livre
    await Book.findByIdAndUpdate(req.params.id, bookObject);

    res.status(200).json({ message: "Le livre a été modifié" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    if (book.userId !== req.auth.userId) {
      return res.status(401).json({ message: "Non-autorisé" });
    }

    const filename = book.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, async (error) => {
      if (error) {
        console.error("Erreur lors de la suppression de l'image du livre:", error);
      }
      await Book.deleteOne({ _id: req.params.id });
      res.status(200).json({ message: 'Book supprimé' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRating = (req, res, next) => {
  // On vérifie que la note est comprise entre 0 et 5
  if (0 <= req.body.rating <= 5) {
      // Stockage de la requête dans une constante
      const ratingObject = { ...req.body, grade: req.body.rating };
      // Suppression du faux _id envoyé par le front
      delete ratingObject._id;
      // Récupération du livre auquel on veut ajouter une note
      Book.findOne({_id: req.params.id})
          .then(book => {
              // Création d'un tableau regroupant toutes les userId des utilisateurs ayant déjà noté le livre en question
              const newRatings = book.ratings;
              const userIdArray = newRatings.map(rating => rating.userId);
              // On vérifie que l'utilisateur authentifié n'a jamais donné de note au livre en question
              if (userIdArray.includes(req.auth.userId)) {
                  res.status(403).json({ message : 'Vous avez déjà noté le livre' });
              } else {
                  // Ajout de la note
                  newRatings.push(ratingObject);
                  // Création d'un tableau regroupant toutes les notes du livre, et calcul de la moyenne des notes
                  const grades = newRatings.map(rating => rating.grade);
                  //const averageGrades = average.average(grades);
                  let some = 0;
                  for( let grade of grades){
                    some +=  grade;
                  }
                  const averageGrades = (some /grades.length).toFixed(1);
                  book.averageRating = averageGrades;
                  // Mise à jour du livre avec la nouvelle note ainsi que la nouvelle moyenne des notes
                  Book.updateOne({ _id: req.params.id }, { ratings: newRatings, averageRating: averageGrades, _id: req.params.id })
                      .then(() => { res.status(201).json()})
                      .catch(error => { res.status(400).json( { error })});
                  res.status(200).json(book);
              }
          })
          .catch((error) => {
              res.status(404).json({ error });
          });
  } else {
      res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
  }
};