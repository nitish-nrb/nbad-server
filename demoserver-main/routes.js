const express = require("express");
const jwt = require('jsonwebtoken')
const { expressjwt: exjwt } = require('express-jwt');
const bcrypt = require('bcryptjs')
const mysql = require("mysql");

const User = require("./Models/Users");
const route = express.Router();

const secretKey = "My Secret Key";
const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256'],
});

require('dotenv').config();

var connection = mysql.createConnection({
  host: "ls-8205fec71102897c7b9f01238ff500dbda68eb50.cfgc6q20alxz.us-east-1.rds.amazonaws.com",
  user: "dbmasteruser",
  password: "HsU$y|Ry[HB;FOj.4j5)ac<_9C)sg3a7",
  database: "dbnbadproject",
  port: 3306
});


const verifyToken = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const token = authorizationHeader.slice(7);

        try {
            const decodedToken = jwt.verify(token, secretKey);
            req.user = decodedToken; // Ensure this is the correct structure based on your token

            // Continue with the next middleware or route handler
            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};









route.post("/app/signup", (req, res) => {

    const encrypted_password = bcrypt.hashSync(req.body.password, 10);

    var query1 = `SELECT * FROM Users WHERE email = ?`
    var query2 = `SELECT * FROM Users WHERE username = ?`




    var query = `INSERT INTO Users SET ?`;
    var user = new User(req.body);
    user.password = encrypted_password;


    connection.query(
        query1,
        [user.email],
        (err,results,fields)=>{
            if(err){
                res.status(400).json({error:err.message})
            }
            else{
                if(results.length>0){
                    // Email is already taken
                    res.status(201).json({message:"Email is already registered, Please Login"})
                }
                else{
                    // Email is not registered
                    connection.query(
                        query2,
                        [user.username],
                        (err,results,fields)=>{
                            if(err){
                                res.status(401).json({message:err.message})
                            }
                            else{
                                if(results.length>0){
                                    // Username is already Taken
                                    res.status(201).json({message:"Username is already taken"})
                                }
                                else{
                                    // New User Entry
                                    connection.query(
                                        query, 
                                        user,
                                        (err, results, fields) => {
                                          if (err) {
                                            res.status(400).json({message:err.message})
                                          }
                                          else{
                                            user.id = results.insertId;
                                            // user = new User(results[0])
                                            var token = jwt.sign(user.getUser(), secretKey, { expiresIn: '1m' });
                                            res.status(200).json({ message: "Signup Successful", token:token });
                                          }  
                                        //   connection.end();
                                        }
                                      );
                                }
                            }
                        }
                    )
                }
            }
        }
    )

    

})

route.post("/app/login", (req, res) => {

    const {username,password} = req.body;

    //1. Check for username or email in db
    //2. If username or email is found -> Retrive Password
    //3. Decrypt the password and validate with input password.
    //4. If Success-> Create a token
    //5. Send token in response to front-end

    var query = `SELECT * FROM Users WHERE username = ? OR email = ?`

        connection.query(
            query, 
            [username,username],
            (err, results, fields) => {
              if (err) {
                res.status(500).json({ message: 'Internal Server Error' });
              }
              else{
                if(results.length>0){
                    var user = new User(results[0])
                    if(bcrypt.compareSync(password,user.password)){
                        //SUCCESSFUL LOGIN
                        var token = jwt.sign(user.getUser(), secretKey, { expiresIn: '1m' });
                        res.status(200).json({ message: "Login Successful", token:token });
                    }
                    else{
                        //Invalid Password
                        res.status(201).json({ message:"Incorrect Password"})
                    }
                }
                else{
                    //No User found
                    res.status(202).json({ message:"User Not Found"})
                }
                
              }  
            //   connection.end();
            }
          ); 
})

route.get("/app/userDetails", verifyToken, (req, res) => {
    const {id} = req.user;

    var query = "SELECT firstName, lastName FROM Users WHERE id =?"
    connection.query(
        query, 
        [id],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            res.status(200).json({ message: "User profile Retrieved successfully", userDetails: results[0] });
          }  
        //   connection.end();
        }
      );

})

route.get("/app/userProfile", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. If token is valid then retrive user details by decoding the token
    //3. Send user details from token in response to the front-end
    var query = "SELECT * FROM Users";
    connection.query(
        query, 
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            const user = new User(results[0])
            var token = jwt.sign(user.getUser(), secretKey, { expiresIn: '1m' });
            res.status(200).json({ message: "User profile Retrieved successfully", token: token, userProfile: user.getUser() });
          }  
        //   connection.end();
        }
      );
})

TODO: 
route.put("/app/userDetails", verifyToken, (req, res) => {

    //1. Check if the token is valid

    //2. If valid -> Update every field

    //Send Response

    var query = `UPDATE Users SET firstName = ?, lastName = ?, username=?, email=?, gender=?, mobile=?  where id= ${req.user.id}`;
    var values = [req.body.firstName, req.body.lastName, req.body.username, req.body.email, req.body.gender, req.body.mobile ]
    var user = new User(req.body);
    // user.password = encrypted_password;

    connection.query(
        query, 
        values,
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            var token = jwt.sign(user.getUser(), secretKey, { expiresIn: '1m' });
            res.status(200).json({ message: "Update Successful", token:token });
          }  
        //   connection.end();
        }
      );

})

// LAST PRIORITY: IF TIME - IMPLEMENT DELETE USER



route.get("/app/userBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get user_id from the token
    //3. Get all budgets from db using user_id
    //4. Send Budget array in response to the front-end 

    const user_id = req.user.id;
    const query = `SELECT * FROM budgets WHERE user_id = ?`
    connection.query(
        query, 
        [user_id],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            if(results.length>0){
               res.status(200).json({message:"Budgets Retrieved Successfully",budgets:results})
            }
            else{
                res.status(201).json({message:"No Budgets Available for the user"})
            }
            
          }  
        //   connection.end();
        }
      );



})


route.post('/app/refreshToken', verifyToken, (req, res) => {
    // Assuming req.user contains user information
    const user = req.user;
    const filteredObject = Object.entries(user).reduce((acc, [key, value]) => {
        if (key !== 'iat' && key !== 'exp') {
          acc[key] = value;
        }
        return acc;
      }, {});
      const newUser = new User(filteredObject);
    // Generate a new token
    const newToken = jwt.sign(newUser.getUser(), secretKey, { expiresIn: '1m' });
  
    res.json({ token: newToken });
  });

route.get("/app/userMonthlyBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get user_id from the token
    //3. Get all monthly budgets from db
    //4. Send Budget array in response to the front-end 

    const user_id = req.user.id;


    const query = `SELECT * FROM monthlybudgets WHERE user_id = ?`
    connection.query(
        query, 
        [user_id],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            if(results.length>0){
               res.status(200).json({message:"Budgets Retrieved Successfully",budgets:results})
            }
            else{
                res.status(201).json({message:"No Budgets Available for the user"})
            }
            
          }  
        //   connection.end();
        }
      );


})

route.get("/app/userMonthlyBudget/:month", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get user_id from the token
    //3. Get all monthly budgets for particular month
    //4. Send Budget array in response to the front-end 
    const month = req.params.month;
    const user_id = req.user.id;

    const query = `SELECT * FROM monthlybudgets WHERE user_id = ? AND month= ?`
    connection.query(
        query, 
        [user_id,month],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            if(results.length>0){
               res.status(200).json({message:"Budgets For Month Retrieved Successfully",budgets:results})
            }
            else{
                res.status(201).json({message:"No Budgets Available for the user"})
            }
            
          }  
          connection.end();
        }
      );


})

route.post("/app/userBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get user_id from the token
    //3. Validate if the budget is not already present 
    //4. If budget item is already present -> ALert user to edit
    //5. If new budget -> Enter into budget table
    //6. Send Response -> Send budget_id
    //Redirect to User Budgets Page
    const user_id = req.user.id;

    const query = `SELECT * FROM budgets WHERE user_id = ? and item = ?`
    connection.query(
        query, 
        [user_id, req.body.item],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            if(results.length>0){
               res.status(201).json({message:"Budgets for item - "+req.body.item+" already present"})
            }
            else{
                // res.status(201).json({message:"No Budgets Available for the user"})
                const budgetQuery = `INSERT INTO budgets SET ?`
                var budgetData = {
                    user_id: user_id,
                    item : req.body.item,
                    budget: req.body.budget
                }
                connection.query(
                    budgetQuery,
                    budgetData,
                    (err, results, fields) => {
                        if (err){
                            res.status(400).json({error:err.message})
                        }
                        else{
                            res.status(200).json({message: "Updated budget", budgets: results})
                        }
                    }
                )
            }
            
          }  
        //   connection.end();
        }
      );



})

route.post("/app/userMonthlyBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get user_id from the token
    //3. Validate if the budget is not already present for  
    //4. If budget item is already present -> ALert user to edit
    //5. If new budget -> ENter into budget table
    //6. Send Response -> Send monthly_budget_id

    const user_id = req.user.id;
    

    const query = `SELECT * FROM monthlybudgets WHERE user_id = ? and month = ? and year = ? and item = ?`
    connection.query(
        query, 
        [user_id, req.body.month, req.body.year, req.body.item],
        (err, results, fields) => {
          if (err) {
            res.status(400).json({error:err.message})
          }
          else{
            if(results.length>0){
               res.status(201).json({message:"Budgets for item - "+req.body.item+" already present"})
            }
            else{
                // res.status(201).json({message:"No Budgets Available for the user"})
                const budgetQuery = `INSERT INTO monthlybudgets SET ?`
                var budgetData = {
                    user_id: user_id,
                    month: req.body.month,
                    year: req.body.year,
                    item : req.body.item,
                    estimatedbudget: req.body.estimatedbudget,
                    actualbudget: req.body.actualbudget
                }
                connection.query(
                    budgetQuery,
                    budgetData,
                    (err, results, fields) => {
                        if (err){
                            res.status(400).json({error:err.message})
                        }
                        else{
                            res.status(200).json({message: "Updated budget monthly", budgets: results})
                        }
                    }
                )
            }
            
          }  
        //   connection.end();
        }
      );

})


route.put("/app/userBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get budget_id from the req.body
    //3. Get the updated object 
    //4. Update the budget in the db using budget_id.
    //5. Send Response
    const budget_id = req.body.budget_id;
    const updated_data = {
        user_id: req.user.id,
        item: req.body.item,
        budget: req.body.budget
    }
    const query = `UPDATE budgets SET ? where budget_id = ${budget_id}`
    connection.query(
        query,
        [updated_data],
        (err, result, fields) =>{
            if(err){
                res.status(400).json({error: err.message});
            }
            else{
                res.status(200).json({message: "Updated budget successfully"});
            }
        }

    )

})

route.put("/app/userMonthlyBudget", verifyToken, (req, res) => {
    //1. Check if the token is valid
    //2. Get monthly_budget_id from the token
    //3. Get the updated object 
    //4. Update the budget in the db using monthly_budget_id.
    //5. Send Response

    const monthlyBudget_id = req.body.monthlybudget_id;
    const updated_data = {
        item: req.body.item,
        month:req.body.month,
        year:req.body.year,
        estimatedbudget: req.body.estimatedbudget,
        actualbudget: req.body.actualbudget
    }

    const query = `UPDATE monthlybudgets SET ? where monthlybudget_id = ${monthlyBudget_id}`
    connection.query(
        query,
        [updated_data],
        (err, result, fields) =>{
            if(err){
                res.status(400).json({error: err.message});
            }
            else{
                res.status(200).json({message: "Updated budget successfully"});
            }
        }

    )

})

route.delete("/app/userBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get budget_id from the token
    //3. Get the object to be deleted
    //4. Delete the required using budget_id
    //5. Send response.

    const budget_id = req.body.budget_id;
    const query = `DELETE FROM budgets where budget_id = ${budget_id}`
    connection.query(
        query,
        (err, result, fields) =>{
            if(err){
                res.status(400).json({error: err.message});
            }
            else{
                res.status(200).json({message: "Deleted budget successfully"});
            }
        }

    )



})

route.delete("/app/userMonthlyBudget", verifyToken, (req, res) => {

    //1. Check if the token is valid
    //2. Get monthly_budget_id from the token
    //3. Get the object to be deleted
    //4. Delete the required using monthly_budget_id
    //5. Send response.

    const monthlyBudget_id = req.body.monthlyBudget_id;

    const query = `DELETE FROM monthlybudgets where monthlybudget_id = ${monthlyBudget_id}`
    connection.query(
        query,
        (err, result, fields) =>{
            if(err){
                res.status(400).json({error: err.message});
            }
            else{
                res.status(200).json({message: "Deleted monthly budget successfully"});
            }
        }

    )

})

module.exports = route; 









