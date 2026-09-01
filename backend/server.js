import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`\n🚀 Full-Stack AI Server running on port ${PORT}`);
});