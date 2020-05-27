CREATE TABLE products (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(256) NOT NULL,
    description VARCHAR(1024) NOT NULL,
    PRIMARY KEY (id)
);

CREATE user 'app' IDENTIFIED WITH mysql_native_password BY  'app';
GRANT ALL ON app.* to 'app';

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    login VARCHAR(256) NOT NULL,
    password VARCHAR(1024) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO products(name, description) VALUES ('Odkurzacz', 'Takie urzadzenie, ktore odkurza');
INSERT INTO products(name, description) VALUES ('Laptop', 'Wejscie do cyfrowego swiata');
INSERT INTO products(name, description) VALUES ('Mikrofon', 'Swiat Cie uslyszy');

INSERT INTO users(login, password) VALUES ('admin', '$2b$08$66ebsxYCoNii7/YaHn4HqunyJYNsN5E4JyJ/pZfOdxQyCsq1HJIYy');
INSERT INTO users(login, password) VALUES ('operator', '$2b$08$tbsxaU0SmXagJGbe4wLWKeq/FBTBfmi7vwpWI/rDsyZfw6zwPtX7q');
INSERT INTO users(login, password) VALUES ('sekurak', '$2b$08$Nw6RdyGjnyXCZ9yMXifX6.xIlkZJrVSMUdupvhOfZPKtTZroTtoTy');

