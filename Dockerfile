FROM node:10

WORKDIR /bawww

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run tsc && mv fake-git .git

USER 1337:1337

CMD ["npm", "start"]
EXPOSE 4400