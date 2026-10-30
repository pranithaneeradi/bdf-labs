const express=require("express");
const app=express()
app.get("/", (req, res) => {
  res.send("Welcome!!");
});
app.get("/about", (req, res) => {
  res.json({
    name: "PRANITHA",
    section: "111"
  });
});
app.get("/time", (req, res) => {
  res.send(new Date().toString());
});

app.use((req, res) => {
  res.status(404).send("404 - Route not found");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
