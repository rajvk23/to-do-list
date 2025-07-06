const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose");
const  _ = require("lodash");
const ejs = require("ejs");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

const itemsSchema =
{
   name: String
};

const Item = mongoose.model("Item", itemsSchema);
async function run()
{
  try
  {
   await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
  }
  catch(err)
  {
    console.log(err);
  }
}
run();



const item1 = new Item(
  {
    name: "Welcome to to do List."
  }
);

const item2 = new Item(
  {
    name: "Hit the + button to add a new item."
  }
);

const item3 = new Item(
  {
    name: "<-- Hit this to delete an item."
  }
);

const ListSchema =
{
  name: String,
  listItems: [itemsSchema]
}

const List = mongoose.model("List", ListSchema);
const workItems = [];
app.get("/", function(req, res)
{
  async function foundItems()
  {
    const items = await Item.find({});
    if(items.length === 0)
    {
      Item.insertMany([item1, item2, item3]);
      res.redirect("/");
    }
    else
    {
      res.render("list", {listTitle: "Today", newListArray: items});
    }
  }
  foundItems();
});

app.get("/:routes", function(req, res)
{
   const routes = _.capitalize(req.params.routes);
   async function finder()
   {
     const gotIt = await List.findOne({name: routes});
     if(!gotIt)
     {
       const list = new List(
       {
        name: routes,
        listItems: [item1, item2, item3]
       });
      list.save();
      res.redirect("/" +  routes);
     }
     else
     {
       res.render("list", {listTitle: gotIt.name, newListArray: gotIt.listItems})
     }
   }
   finder();


});


app.post("/", function(req, res)
{
  let newItem = req.body.newItem;
  const listName = req.body.list;
  if (newItem && newItem.trim() !== "") { // Only add if not empty
    const itemName = new Item({
      name: newItem
    });
    if(listName === "To Do List")
    {
      itemName.save();
      res.redirect("/");
    }
    else
    {
      async function finder()
      {
        const foundList = await List.findOne({name: listName});
        foundList.listItems.push(itemName);
        foundList.save();
        res.redirect("/" + listName);
      }
      finder();
    }
  } else {
    // Just redirect without adding if empty
    if(listName === "To Do List") {
      res.redirect("/");
    } else {
      res.redirect("/" + listName);
    }
  }
});

app.post("/delete", function(req, res)
{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today")
  {
    async function removeId()
    {
        const deletedId = await Item.findByIdAndRemove(checkedItemId);
    }
    removeId();
    res.redirect("/");
  }
  else
  {
    async function findAndRemove()
    {
      const result = await List.findOneAndUpdate({name: listName}, {$pull: {listItems: {_id: checkedItemId}}});
      res.redirect("/" + listName);
    }
    findAndRemove();
  }

});

app.get("/about", function(req, res)
{
  res.render("about");
});
app.listen(3000, function()
{
  console.log("Server is running at port 3000");
});
