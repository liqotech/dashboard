import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
import registerServiceWorker, { unregister } from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';

/*ReactDOM.render(
    <Router>
        <App />
    </Router>, 
    document.getElementById('root')
);*/

const main = document.createElement('div');
document.body.appendChild(main);
main.setAttribute('id', 'main');
ReactDOM.render(<Router><App /></Router>, main);

unregister();
