import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{textAlign: 'center'}}>
        {/*<Title level={4} style={{textAlign: 'center'}}>
          Can't show data (refer to JSON)
        </Title>*/}
          Can't show data (refer to JSON)
        </div>
      )
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
