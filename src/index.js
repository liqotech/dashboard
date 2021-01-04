import React from 'react';
import './themes/light-theme.less'
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import { BrowserRouter as Router } from 'react-router-dom';
import dark from './themes/dark.json';
import light from './themes/light.json';

if(localStorage.getItem("theme") === 'dark' || !localStorage.getItem("theme")) {
  localStorage.setItem('theme', 'dark');
  window.less.modifyVars(dark);
}
else if(localStorage.getItem("theme") === 'light')
  window.less.modifyVars(light);
else window.less.modifyVars(JSON.parse(localStorage.getItem("theme")))

const main = document.createElement('div');
document.body.appendChild(main);
main.setAttribute('id', 'main');
ReactDOM.render(
    <Router basename={process.env.PUBLIC_PATH}>
      <App />
    </Router>
  , main
);
