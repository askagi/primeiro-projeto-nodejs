const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();
app.use(express.json());

const customers = [];
// Middleware
function verifyIfExistAccountCPF (request, response, next) {
  const {cpf} = request.headers; 
  const customer = customers.find( (customer) => customer.cpf === cpf);
  if(!customer) {
    return response.status(400).json({ error: 'Customer not found'})
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  // acc -> acomulador
  // operation -> statement
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    }else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const customersAlreadyExists = customers.some( (customer) => customer.cpf === cpf );
  if (customersAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!'});
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();
});

// app.use(verifyIfExistAccountCPF);

app.get('/statement', verifyIfExistAccountCPF, (request, response) => {
  const {customer} = request;
  return response.json(customer.statement);
});

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  // recupera o 'customer' de dentro do verfyIfExistAccountCPF
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation);

  return response.status(201).json(customer);
});

app.post('/withdraw', verifyIfExistAccountCPF, (request, response) => {
  const {amount} = request.body;
  const {customer} = request;

  const balance = getBalance(customer.statement);
  console.log(balance);
  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!'});
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  };

  customer.statement.push(statementOperation);

  return response.status(201).json(customer);
})

app.listen(3333, () => {
  console.log('Server started....');
})