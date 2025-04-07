import React from "react";
import './LoginSignUp.css';
import Login from '../../components/UserLoginRegis/Login';
import '../../App.css';

function LoginSignUp(){

    return (
        <div className="App-background">
            <Login/>
        </div>
    );
}

export default LoginSignUp;