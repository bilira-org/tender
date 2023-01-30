const fs = require("fs");
const blog_idl = require("./target/idl/tender.json");

fs.writeFileSync("./app/idl.json", JSON.stringify(blog_idl, null, 2));
