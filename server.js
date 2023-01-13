//..............Include Express..................................//
const express = require('express');
const fs = require('fs');
const ejs = require('ejs');

//..............Create an Express server object..................//
const app = express();

//..............Apply Express middleware to the server object....//
app.use(express.json()); //Used to parse JSON bodies (needed for POST requests)
app.use(express.urlencoded());
app.use(express.static('public')); //specify location of static assests
app.set('views', __dirname + '/views'); //specify location of templates
app.set('view engine', 'ejs'); //specify templating library
let user="";
let recipeIdArray = [];
let tempRecipeID = 1;
//.............Define server routes..............................//
//Express checks routes in the order in which they are defined

app.get('/', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("index");
});


app.get('/results', function(request, response) {
    let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));

    //accessing URL query string information from the request object
    let opponent = request.query.opponent;
    let playerThrow = request.query.throw;

    if(opponents[opponent]){
      let opponentThrowChoices=["Paper", "Rock", "Scissors"];
      let results={};

      results["playerThrow"]=playerThrow;
      results["opponentName"]=opponent;
      results["opponentPhoto"]=opponents[opponent].photo;
      results["opponentThrow"] = opponentThrowChoices[Math.floor(Math.random() * 3)];

      if(results["playerThrow"]===results["opponentThrow"]){
        results["outcome"] = "tie";
      }else if(results["playerThrow"]==="Paper"){
        if(results["opponentThrow"]=="Scissors") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else if(results["playerThrow"]==="Scissors"){
        if(results["opponentThrow"]=="Rock") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else{
        if(results["opponentThrow"]=="Paper") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }

      if(results["outcome"]=="lose") opponents[opponent]["win"]++;
      else if(results["outcome"]=="win") opponents[opponent]["lose"]++;
      else opponents[opponent]["tie"]++;

      //update opponents.json to permanently remember results
      fs.writeFileSync('data/opponents.json', JSON.stringify(opponents));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("results", {
        data: results
      });
    }else{
      response.status(404);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"404"
      });
    }
});

app.get('/scores', function(request, response) {
  let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
  let opponentArray=[];

  //create an array to use sort, and dynamically generate win percent
  for(name in opponents){
    opponents[name].win_percent = (opponents[name].win/parseFloat(opponents[name].win+opponents[name].lose+opponents[name].tie) * 100).toFixed(2);
    if(opponents[name].win_percent=="NaN") opponents[name].win_percent=0;
    opponentArray.push(opponents[name])
  }
  opponentArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("scores",{
    opponents: opponentArray
  });
});

app.get('/recipe/:recipeID', function(request, response) {
  let recipes = JSON.parse(fs.readFileSync('data/recipes.json'));
  let comments = JSON.parse(fs.readFileSync('data/comments.json'));
  // using dynamic routes to specify resource request information
  let recipeID = request.params.recipeID;
  let recipeName;
  for(recipe in recipes){
    if(recipes[recipe].recipeID && recipes[recipe].recipeID == recipeID){
      recipeName = recipes[recipe].recipeName;
    }
  }

  if(recipes[recipeName]){
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("recipeDetails",{
      recipe: recipes[recipeName],
      comments: comments
    });

  }else{
    response.status(404);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"404"
    });
  }
});

app.get('/createRecipe', function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("createRecipe")
});

app.post('/createComment', function(request, response) {
  let commentsJSON = JSON.parse(fs.readFileSync('data/comments.json'));
  let recipes = JSON.parse(fs.readFileSync('data/recipes.json'));
  let name;
  if(user != ""){
    name = user
  }else if(request.body.name == undefined){
    name = request.body.name
  }else{
    name = ""
  }
  let rating = request.body.rating
  let review = request.body.review
  let recipe = request.body.recipeName
  if(name && rating && review){
    let newComment = {
      name: name,
      rating: rating,
      review: review,
    }
    commentsJSON[recipe].name = newComment;
    fs.writeFileSync('data/comments.json', JSON.stringify(commentsJSON));
    
    response.status(200);
    response.render("recipeDetails",{
      recipe: recipes[recipe],
      comments: commentsJSON
    });
  }else{
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"400"
    });
  }
});

app.get("/login", function(request, response){
  let username = request.query.username
  let password = request.query.password;
  let users = JSON.parse(fs.readFileSync('data/users.json'));

  if(users[username] = password){
    user = username
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.redirect("recipes");
  }else{
    console.log("fail")
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("index");
  }
})

app.post('/createRecipe', function(request, response) {
  let recipesJSON = JSON.parse(fs.readFileSync('data/recipes.json'));
  if(user != ""){
    recipeAuthor = user
  }else{
    recipeAuthor = request.body.recipeAuthor
  }
  let recipePhoto = request.body.recipePhoto
  let recipeName = request.body.recipeName
  let recipeTime = request.body.recipeTime
  let recipeDifficulty = request.body.recipeDifficulty
  let recipeID = tempRecipeID;
  tempRecipeID += 1;

  if(recipeName && recipeAuthor){

  let ingredientNames = []
  let ingredientQuantities = []
    for(let i = 1; i < 21; i++){
      let a = "ingredient" + i.toString()
      ingredientNames.push(request.body[a])

      let b = "quantity" + i.toString()
      ingredientQuantities.push(request.body[b])
    }
    
    let newRecipe ={
      recipeName: recipeName,
      recipeAuthor: recipeAuthor,
      recipeDifficulty: request.body.recipeDifficulty, //integer from a scale of 1 to 3 : beginner, intermediate, expert
      recipeTime: request.body.recipeTime, //minutes, though idk if we're going to validate this
      recipeImage: request.body.recipePhoto,
      recipeIngredientNames: ingredientNames,
      recipeIngredientQuantities: ingredientQuantities,
      recipeSteps: request.body.steps,
      recipeID: recipeID
    }
    recipesJSON[recipeName] = newRecipe
    fs.writeFileSync('data/recipes.json', JSON.stringify(recipesJSON));
    let commentsJSON = JSON.parse(fs.readFileSync('data/comments.json'));
    commentsJSON[recipeName] = {}
    fs.writeFileSync('data/comments.json', JSON.stringify(commentsJSON));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.redirect("/recipe/"+recipeID);
  }else{
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"400"
    });
  }
    
});

app.get('/recipes', function(request, response) {
  
  let recipesJSON = JSON.parse(fs.readFileSync('data/recipes.json'));
  let arrayOfRecipeNames = [];
  let arrayOfRecipeAuthors = [];
  let arrayOfRecipeImages = [];
  let arrayOfDifficulty = [];
  let arrayOfTime = [];
  let arrayOfIds = []
  for(recipe in recipesJSON){
    arrayOfRecipeNames.push(recipesJSON[recipe].recipeName);
    arrayOfRecipeAuthors.push(recipesJSON[recipe].recipeAuthor);
    arrayOfRecipeImages.push(recipesJSON[recipe].recipeImage);
    arrayOfDifficulty.push(recipesJSON[recipe].recipeDifficulty);
    arrayOfTime.push(recipesJSON[recipe].recipeTime);
    arrayOfIds.push(recipesJSON[recipe].recipeID);
  }
  response.status(200);
  response.setHeader('Content-Type', 'text/html');
  response.render("recipes", {
    recipenames: arrayOfRecipeNames,
    recipeauthors: arrayOfRecipeAuthors,
    recipeimages: arrayOfRecipeImages,
    recipetimes: arrayOfTime,
    recipelevels: arrayOfDifficulty,
    recipeids: arrayOfIds
  })
  console.log(arrayOfRecipeNames)
});

// Because routes/middleware are applied in order,
// this will act as a default error route in case of
// a request fot an invalid route
app.use("", function(request, response){
  response.status(404);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    "errorCode":"404"
  });
});

//..............Start the server...............................//
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started at http://localhost:'+port+'.')
});



/**
 app.get('/yabbadabbadoo')
 */

//

