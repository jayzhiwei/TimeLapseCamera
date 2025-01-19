import React from "react";
import './LoginSignUp.css';
import Login from '../../components/UserLogin/Login.js';
import '../../App.css';

function LoginSignUp(){

    return (
        <div className="App-background">
            <Login />
        </div>
    );
}

export default LoginSignUp;