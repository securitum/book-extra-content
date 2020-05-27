import * as express from 'express';
import * as nunjucks from 'nunjucks';
import * as bodyParser from 'body-parser';
import * as expressSession from 'express-session';
import { exec, ExecOptions } from 'child_process';
import * as expressWs from 'express-ws';
import * as mysql from 'mysql';
import * as libxmljs from 'libxmljs';
import { createHmac } from 'crypto';

interface Example {
    title: string;
    description: string;
    href: string;
};

const examples: Array<Example> = [
    {
        title: 'Logowanie #1',
        description: 'Atak bruteforce na logowanie: ustalenie nazwy użytkownika i hasła',
        href: '/1'
    },
    {
        title: 'Logowanie #2',
        description: 'Atak bruteforce na logowanie. Czy tutaj da się ustalić poprawną nazwę użytkownika?',
        href: '/2'
    },
    {
        title: 'ping',
        description: 'Aplikacja udostępnia prostą funkcjonalność: ping. Czy coś może pójść nie tak?',
        href: '/ping'
    },
    {
        title: 'Faktury',
        description: 'Aplikacja pozwala wyłącznie na dostęp do swojej faktury...',
        href: '/invoice?key=901ee71e933b4ae83353586c18a3d623&invoiceId=123'
    },
    {
        title: 'Kontrola dostępu',
        description: 'W aplikacji zdefiniowano kilka ról użytkowników. Pytanie: czy każdy ma dostęp tylko do tych zasobów, do których powinien być uprawniony? Konta użytkowników to: operator, accountant, main-accountant, storekeeper',
        href: '/access-control',
    },
    {
        title: 'Lista produktów #1',
        description: 'Ta aplikacja pozwala nam pobrać podstawowe informacje o produktach (a może i o czymś więcej).',
        href: '/sql',
    },
    {
        title: 'Lista produktów #2',
        description: 'Ta aplikacja pozwala nam pobrać podstawowe informacje o produktach, choć może być trudniej zauważyć na pierwszy rzut oka jak to robi.',
        href: '/sql2',
    },
    {
        title: 'Lista produktów #3',
        description: 'Ta aplikacja pozwala pobrać informacje o produktach, wykorzystując do tego XML',
        href: '/xml-products',
    },
]

const app = express();
const wsApp = expressWs(app);
app.set('etag', false);
const urlencoded = bodyParser.urlencoded({ extended: false });


const session1 = expressSession({
    secret: 'something-totally-random',
    resave: false,
    saveUninitialized: true,
    name: 'example1-session'
});

app.use('/.git/', express.static('.git/', {
    'index': false,
}));

app.get('/', (req, res) => {
    const host = req.get('host').split('.')[0];
    if (host === 'debug') {
        return res.send(`DB_HOST: localhost\nDB_USER: root\nDB_PASS: 8fjS85avk84idjAS9vnaSdf994`);
    } else if (host === 'www-test') {
        return res.send('Testing page is currently turned off');
    } else if (host === 'it-support') {
        return res.send('Here comes the IT');
    }
    res.send(nunjucks.render('templates/main.html', { examples }));
});

app.get('/1', session1, (req, res) => {
    const error = req.session.error || null;
    req.session.error = null;
    res.send(nunjucks.render('templates/1.html', {
        error,
        loggedIn: req.session.loggedIn
    }));
});

app.post('/login', urlencoded, (req, res) => {
    const username = <string>req.body.login;
    const password = <string>req.body.password;
    if (username !== 'host') {
        return res.send({
            'err': 'Nieprawidłowa nazwa użytkownika',
        });
    } else if (password !== 'spiderman') {
        return res.send({
            'err': 'Nieprawidłowe hasło',
        });
    } else {
        res.send({
            'status': 'Zalogowany!'
        })
    };
});

app.post('/1/login', session1, urlencoded, (req, res) => {
    const username = <string>req.body.login;
    const password = <string>req.body.password;

    if (username !== 'host') {
        req.session.error = 'Nieprawidłowa nazwa użytkownika';
    } else if (password !== 'spiderman') {
        req.session.error = 'Nieprawidłowe hasło';
    } else {
        req.session.loggedIn = true;
    }
    res.redirect('/1');
});

const session2 = expressSession({
    secret: 'something-totally-random2',
    resave: false,
    saveUninitialized: true,
    name: 'example2-session'
});

app.get('/2', session2, (req, res) => {
    const error = req.session.error || null;
    req.session.error = null;
    res.send(nunjucks.render('templates/1.html', {
        error,
        loggedIn: req.session.loggedIn
    }));
});

function sleep(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
}

app.post('/2/login', session2, urlencoded, async (req, res) => {
    console.log(req.body);
    const username = <string>req.body.login;
    const password = <string>req.body.password;

    if (username !== 'operator' || password !== 'qwertyui') {
        req.session.error = 'Błędne dane logowania';
        if (username === 'operator') {
            await sleep(200 + 50 * Math.random());
        }
    } else {
        req.session.loggedIn = true;
    }
    res.redirect('/2');
});

app.get('/ping', (req, res) => {
    res.send(nunjucks.render('./templates/ping.html'));
});

app.post('/ping', urlencoded, (req, res) => {
    const host = req.body.host || '';

    const cmd = `ping -c2 ${host}`;
    const options: ExecOptions = { 
        shell: '/bin/sh',
        timeout: 10000
    };

    exec(cmd, options, (err, stdout: Buffer, stderr: Buffer) => {
        res.send({
            output: err ? stderr.toString() : stdout.toString()
        });
    });

});


const names = [
    'Zuzanna',
    'Julia',
    'Paulina',
    'Maja',
    'Zofia',
    'Hanna',
    'Lena',
    'Maria',
    'Alicja',
    'Amelia',
    'Oliwia',
    'Antoni',
    'Jakub',
    'Jan',
    'Szymon',
    'Aleksander',
    'Franciszek',
    'Filip',
    'Wojciech',
    'Mikołaj',
    'Kacper'
];

const surnames = [
    "Nowak",
    "Wójcik",
    "Kowalczyk",
    "Woźniak",
    'Kowalski',
    "Wiśniewski",
    "Kamiński",
    "Lewandowski",
    "Zieliński",
    "Szymański",
    'Bentkowski'
];

const PRODUCTS = [
    "Odkurzacz",
    "Pralka",
    "Zmywarka",
    "Telewizor",
    "Laptop",
    "Chłodziarka",
    "Wiertarka",
];

function randomElement<T>(array: Array<T>): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomName(): string {
    const name = randomElement(names);
    let surname = randomElement(surnames);

    if (name.endsWith('a')) {
        surname = surname.replace(/ski$/, 'ska');
    }

    return `${name} ${surname}`;
}

interface Product {
    name: string;
    price: string;
}
interface Invoice {
    id: number;
    name: string;
    products: Array<Product>;
}
const INVOICES: Array<Invoice> = Array.from({length: 200})
    .map((_, i) => {
        const products: Array<Product> = [];
        const numProducts = Math.ceil(Math.random() * 5);
        for (let i = 0; i < numProducts; ++i) {
            products.push({
                name: randomElement(PRODUCTS),
                price: (Math.random() * 5000).toFixed(2),
            });
        }

        return {
            id: i,
            name: randomName(),
            products
        };
    });

INVOICES[123].name = 'Michał Bentkowski';
INVOICES[123].products = [
    {
        name: 'Laptop',
        price: '6499.99'
    },
    {
        name: 'Odkurzacz',
        price: '599'
    }
];

app.get('/invoice', (req, res) => {
    let err: string[] = [];
    let invoice: Invoice;
    let sum: string;
    if (req.query.invoiceId == null) {
        err.push('Musisz podać identyfikator faktury');
    }
    if (req.query.key == null) {
        err.push('Musisz podać klucz');
    } else if (req.query.key !== '901ee71e933b4ae83353586c18a3d623') {
        err.push('Niepoprawny klucz');
    } else {
        invoice = INVOICES[+req.query.invoiceId];
        if (invoice == null) {
            err.push('Niepoprawny identyfikator faktury: ' +req.query.invoiceId);
        } else {
            sum = invoice.products.map(p => p.price).reduce((a, b) => (+a) + (+b), 0).toFixed(2);
        }
        
    }
    res.send(nunjucks.render('./templates/invoice.html', { err, invoice, sum }));

});

const acSession = expressSession({
    secret: 'co02iea9dsj',
    name: 'access-control',
    cookie: {
        path: '/access-control'
    },
    resave: false,
    saveUninitialized: true,
});

/* 
    trzy grupy użytkowników: zarządzanie użytkownikami
    operator: lista użytkowników, dodaj użytkownika, usuń użytkownika
    główny księgowy: wystaw fakturę, zmień fakturę, usuń fakturę, pobierz fakturę, lista faktur
    księgowy: wystaw fakturę, pobierz fakturę, lista faktur
    magazynier: pobierz dane produktu, zmień liczbę produktów

    FUNKCJONALNOŚCI:
     - użytkownicy: lista, dodaj, usuń, pobierz
     - faktury: lista, wystaw, zmień, usuń, pobierz
     - produkty: lista, pobierz, zmień, dodaj


*/

interface Operation {
    description: string;
    url: ACPermission;
}

const OPERATIONS = {
    "/user/list": "Wylistuj użytkowników",
    "/user/add": "Dodaj użytkownika",
    "/user/delete": "Usuń użytkownika",
    "/user/change-password": "Zmień hasło użytkownikowi",
    "/user/get": "Pobierz dane użytkownika",
    "/invoice/list": "Wylistuj faktury",
    "/invoice/create": "Wystaw fakturę",
    "/invoice/delete": "Usuń fakturę",
    "/invoice/get": "Pobierz fakturę",
    "/product/list": "Wylistuj produkty",
    "/product/create": "Dodaj produkt",
    "/product/delete": "Usuń produkt",
    "/product/change-count": "Zmień ilość produktu"
};

type ACPermission =
    '/user/list'| '/user/add' | '/user/delete' | '/user/change-password' | '/user/get' | '/invoice/list' | '/invoice/create' | '/invoice/delete' | '/invoice/get' | '/invoice/list' | '/invoice/create' | '/invoice/delete' | '/invoice/get' | '/product/list' | '/product/create' | '/product/delete' | '/product/change-count';

interface ACUser {
    loginAndPassword: string;
    permissions: Array<{url: ACPermission, show: boolean}>;
}

const AC_USERS: Array<ACUser> = [
    {
        loginAndPassword: 'operator',
        permissions: [
            {url: '/user/add', show: true},
            {url: '/user/change-password', show: true},
            {url: '/user/delete', show: true},
            {url: '/user/get', show: true},
            {url: '/user/list', show: true},
        ]
    },
    {
        loginAndPassword: 'accountant',
        permissions: [
            {url: '/invoice/create', show: true},
            {url: '/invoice/get', show: true},
            {url: '/invoice/list', show: true},
            {url: '/invoice/delete', show: false},
            {url: '/user/add', show: false},
        ]
    },
    {
        loginAndPassword: 'main-accountant',
        permissions: [
            {url: '/invoice/create', show: true},
            {url: '/invoice/get', show: true},
            {url: '/invoice/list', show: true},
            {url: '/invoice/delete', show: true},
            {url: '/product/create', show: true},
            {url: '/product/delete', show: true},
            {url: '/product/list', show: true},
            {url: '/user/add', show: false},
        ]
    },
    {
        loginAndPassword: 'storekeeper',
        permissions: [
            {url: '/product/list', show: true},
            {url: '/product/change-count', show: true},
            {url: '/user/add', show: false},
        ]
    },
];


app.get('/access-control', acSession, (req, res) => {
    const params = {
        user: req.session.user,
        error: req.session.error,
        operations: {}
    };
    req.session.error = null;
    if (params.user) {
        const userPermissions = AC_USERS.filter(u => u.loginAndPassword === params.user)[0].permissions.filter(p => p.show).map(p => ({ url: '/access-control' + p.url, description: OPERATIONS[p.url]}));
        const operations = {
            user: [],
            product: [],
            invoice: [],
        };
        for (let p of userPermissions) {
            const category = p.url.split('/')[2];
            operations[category].push(p);
        }
        params.operations = operations;
    }

    res.send(nunjucks.render('./templates/access-control.html', params));
});

for (let oper of Object.keys(OPERATIONS)) {
    app.get('/access-control' + oper, acSession, (req, res) => {
        const params = {
            error: ''
        };
        if (req.session.user == null) {
            params.error = 'Niezalogowany!';
        } else {
            const user = req.session.user;
            const allowed = AC_USERS
                .filter(u => u.loginAndPassword === user)[0]
                .permissions.filter(p => p.url === oper)[0] != undefined;
            
            if (!allowed) params.error = 'Brak uprawnień do wykonania tej akcji!';
        }
        const status = params.error === '' ? 200 : 403;

        res.status(status).send(nunjucks.render('./templates/access-control-action.html', params));
    });
}

app.post('/access-control/login', acSession, urlencoded, (req, res) => {
    const { login, password } = req.body;
    const possibleLogins = AC_USERS.map(u => u.loginAndPassword);
    if (login === password && possibleLogins.includes(login)) {
        req.session.user = login;
    } else {
        req.session.error = 'Niewłaściwe dane logowania';
    }
    res.redirect('/access-control')
});

app.get('/access-control/logout', acSession, (req, res) => {
    req.session.user = null;
    req.session.error = null;
    res.redirect('/access-control')
});

wsApp.app.ws('/echo', (ws, req) => {
    ws.on('message', (msg: string) => ws.send(msg.toUpperCase()));
});



interface SqlProduct {
    id: number;
    name: string;
    description: string;
}
app.get('/sql', (req, res) => {
    mysqlConn.query('SELECT * FROM products', (err, result: SqlProduct[]) => {
        res.send(nunjucks.render('./templates/sql.html', { products: result }));
    });

});

app.get('/sql/get-product', (req, res) => {
    const productId = req.query.id || 1;
    const query = `SELECT * FROM products WHERE id = ${productId} `;
    mysqlConn.query(query, (err, result) => {
        if (result && result[0]) {
            res.send(result[0])
        } else {
            res.send({});
        }
        
    })
});

app.get('/sql2', (req, res) => {
    mysqlConn.query('SELECT * FROM products', (err, result: SqlProduct[]) => {
        res.send(nunjucks.render('./templates/sql2.html', { products: result }));
    });

});


wsApp.app.ws('/sql2-ws', (ws, res) => {
    ws.on('message', (data: string) => {
        let parsed: {cmd?: string, id?: number};
        try {
            parsed  = JSON.parse(data);
        } catch(ex) {
            parsed = {};
        }
        
        if (parsed.cmd === 'getProduct') {
            const id = parsed.id;
            const query = `SELECT * FROM products WHERE id = ${id} `;
            mysqlConn.query(query, (err, result) => {
                let toSend;
                if (err) {
                    toSend = err;
                } else if (result && result[0]) {
                    toSend = {cmd: parsed.cmd, info: result[0] };
                } else {
                    toSend = {};
                }

                ws.send(JSON.stringify(toSend));
            });
        }
    });
});

const HMAC_KEY = '55448a3e-b70d-43fe-85ff-2c9f2bfc92de';

app.get('/xml-products', (req, res) => {
    mysqlConn.query('SELECT * FROM products', (err, result: SqlProduct[]) => {
        res.send(nunjucks.render('./templates/xxe.html', { products: result }));
    });
});

app.post('/xml-products', bodyParser.text({type: 'text/plain'}), (req, res) => {
    const hmac = createHmac('sha512', HMAC_KEY);
    hmac.update(req.body);
    const expectedDigest = hmac.digest('hex');
    const headerDigest = req.get('x-integrity');

    if (expectedDigest !== headerDigest) {
        return res.send({
            err: 'Invalid integrity'
        });
    }

    let doc: libxmljs.Document;
    try {
        doc = libxmljs.parseXmlString(req.body, { noent: true });
    } catch (ex) {
        return res.send(ex);
    }
    
    const method = doc.find('//method')?.[0]?.text();
    const id = +doc.find('//id')?.[0]?.text();
    if (method !== 'getProduct') {
        return res.send({
            err: 'Unknown method: ' + method
        })
    }
    const query = `SELECT * FROM products WHERE id = ${id} `;
    mysqlConn.query(query, (err, result) => {
        if (result && result[0]) {
            res.send(result[0])
        } else {
            res.send({});
        }
        
    })
});
 
let mysqlConn: mysql.Connection;

function promiseMySqlConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
        mysqlConn = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'app',
            password: process.env.DB_PASSWORD || 'app',
            database: process.env.DB_NAME || 'app',
        });
        mysqlConn.connect(err => {
            if(err) {
                reject(err);
            } else {
                resolve();
            }
        });
    }); 
}


(async () => {
    console.log('Trying to connect to mysql...1');
    while (1) {
        try {
            await promiseMySqlConnect();
        } catch (ex) {
            await sleep(500);
            console.log('Another try...');
            continue;
        }
        console.log('Connected!');
        break;
    }
    const PORT = 4400;
    app.listen(PORT, () => {
        console.log(`Listening on http://localhost:${PORT}`);
    });
})();

