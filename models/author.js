var mongoose = require("mongoose");
var moment = require("moment");

var Schema = mongoose.Schema;

var AuthorSchema = new Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date }
});

// Virtual for author's full name

AuthorSchema.virtual("name").get(function() {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  var fullName = "";
  if (this.first_name && this.family_name) {
    fullname = this.first_name + " " + this.family_name;
  }
  if (!this.first_name || !this.family_name) {
    fullname = "";
  }

  return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function() {
  return (
    moment(this.date_of_birth).format("YYYY") +
    " - " +
    moment(this.date_of_death).format("YYYY")
  );
});

// Virtual for author's birth date formatted for forms
AuthorSchema.virtual("dob_form").get(function() {
  return moment(this.date_of_birth).format("YYYY-MM-DD");
});

// Virtual for author's death date formatted for forms
AuthorSchema.virtual("dod_form").get(function() {
  return moment(this.date_of_death).format("YYYY-MM-DD");
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function() {
  return "/catalog/author/" + this._id;
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema);
