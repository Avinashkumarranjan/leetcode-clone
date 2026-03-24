const validator = require("validator");





const validate = (data)=>{
  const mandatoryField = ["firstName","emailId","password"] ;
  
  const isAllowed =  mandatoryField.every((k)=> Object.keys(data).includes(k));

  if(!isAllowed){
    throw new Error("Some fields are missing");
  }

  if(!validator.isEmail(data.emailId)){
    throw new Error("Email is not valid");
  }

  if(!validator.isStrongPassword(data.password)){
    throw new Error("Password is not strong enough");
  }

}
module.exports = validate;