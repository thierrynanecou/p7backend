
const Book = require("../models/bookModel");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  // suppression de l'id livre envoyé par le front
  delete bookObject._id;
  // suppression de l'userid  envoyé par le front par mesure de sécurité
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Book enregistré" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
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
    .catch((error) => res.status(405).json({ error }));
};
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  delete bookObject._userId;
  //récupération du livre existant à modfier
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      //vérifier si l'utilisateur qui a créé le livre cherche à le modfier
      if (book.userId !== req.auth.userId) {
        res.status(403).json({ message: " erreur d'authorisation" });
      } else {
        
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
          //suppression de l'ancienne image
         if(req.file) {
        fs.unlink(`images/${book.imageUrl.split("/images/")[1]}`, (error) => {
          if (error)
            console.log("erreur de la suppression de l'image book" + error);
        })};
            req.status(200).JSON({ message: "le livre a été modifié" })}
          )
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(404).json({ error }));
};
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (book.userId != req.auth.userId) {
          return res.status(401).json({ message: 'Non-autorisé' });
        }
  
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Book supprimé' });
            })
            .catch(error => {
              res.status(401).json({ error });
            });
        });
      })
      .catch(error => {
        res.status(500).json({ error });
      });
  };