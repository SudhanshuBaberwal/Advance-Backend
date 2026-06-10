FROM node

WORKDIR /app

# COPY package.json package.json
# COPY package-lock.json package-lock.json
# RUN npm install
# COPY index.js index.js

# This means copy all the files start with package name and put it into this directory .
COPY package*.json .   
RUN npm install 
COPY . .


CMD [ "node" ,"index.js" ]