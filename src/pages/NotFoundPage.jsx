import { Link } from 'react-router-dom';
import '../App.css';

const NotFoundPage = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn">Go to Homepage</Link>
    </div>
  );
};

export default NotFoundPage;