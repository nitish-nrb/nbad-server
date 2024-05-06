class Users{
    constructor(user){
        this.id=user.id;
        this.firstName=user.firstName;
        this.lastName=user.lastName;
        this.username=user.username;
        this.email = user.email
        this.password=user.password;
        this.gender = user.gender;
        this.mobile = user.mobile;
       
    }

    getUser(){
        var usr = {
            "id":this.id,
            "firstName":this.firstName,
            "lastName":this.lastName,
            "username":this.username,
            "email":this.email,
            "gender":this.gender,
            "mobile":this.mobile
        }

        return usr;
    }
}
module.exports = Users;