import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class DashboardGeneral extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={{marginTop: 20, marginLeft: "auto", marginRight: "auto", maxWidth: "70%"}} >
        {/** Maybe put something for the front page? */}
      </div>
    );
  }
}

export default withRouter(DashboardGeneral);
