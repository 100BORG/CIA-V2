-- Shared service descriptions table for all users
CREATE TABLE IF NOT EXISTS descriptions (
    id serial PRIMARY KEY,
    text text NOT NULL
);

-- Insert default descriptions (run only once)
INSERT INTO descriptions (text) VALUES
('US Federal Corporation Income Tax Return (Form 1120)'),
('Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)'),
('Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)'),
('Application for Automatic Extension of Time To File Business Income Tax (Form 7004)');
