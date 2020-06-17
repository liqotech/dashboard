import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import { BrowserRouter as Router } from 'react-router-dom';

const main = document.createElement('div');
document.body.appendChild(main);
main.setAttribute('id', 'main');
ReactDOM.render(<Router><App /></Router>, main);
