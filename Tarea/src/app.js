import express, { urlencoded } from "express"
import fs from "fs"
import handlebars from "express-handlebars"
import __dirname from "./utils.js"


const app = express()



const productos = "productos.json"
const carrito = "carrito.json"
app.use(urlencoded({extended:true}))
app.use(express.json())


app.set("views", `${__dirname}/views`)

app.engine("handlebars", handlebars.engine())
app.set("view engine", "handlebars")

app.use("/", express.static(__dirname + "/public"))
app.listen(8081, () =>  console.log("Iniciando servidor"))


app.get("/", async(req,res) => {
    const traerProductos = await fs.promises.readFile(productos, "utf-8")

    const parseados = JSON.parse(traerProductos)

    res.render("home", {products: parseados})

})


app.get("/limit/:numero", async(req,res) => {

    const params = req.params.numero

    const traerProductos = await fs.promises.readFile(productos, "utf-8")

    const parseados = JSON.parse(traerProductos)

    let productosLimitados = []

    for(let i = 0; parseados.length > i && params > i; i++){

        productosLimitados.push(parseados[i])

    }

    res.render("home", {products: productosLimitados})

})


app.get("/buscar/:id", async(req,res) => {

    const params = req.params.id

    const traerProductos = await fs.promises.readFile(productos, "utf-8")

    const parseados = JSON.parse(traerProductos)

    const filtrados = parseados.find(element => element.id == params)

    console.log(filtrados)
    res.render("home", {productsId: filtrados, Buscado: true})

})


app.get("/agregar/productos", (req,res) => {

    res.render("form")    

})


app.post("/agregar/productos", async(req,res) => {

    const body = req.body

    const traerProductos = await fs.promises.readFile(productos, "utf-8")

    const parseados = JSON.parse(traerProductos)



    let resultado = '';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = "1234567890"
    for (let i = 0; i < 2; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    for(let i = 0; i < 3; i++){
        resultado += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }


    let newProduct = {
        title: body.title,
        description: body.description,
        code: resultado,
        price: body.price,
        stock: body.stock,
        category: body.category,
        id: parseados.length + 1
    }

    parseados.push(newProduct)

    await fs.promises.writeFile(productos, JSON.stringify(parseados, null, "\t"))

    res.send({status:"enviado"})
})


app.get("/actualizar/:id", async(req,res) => {

        const params = parseInt(req.params.id)

        const body = req.body

        const Productos = await fs.promises.readFile(productos, "utf-8");
        const Parseado = JSON.parse(Productos);
        const encontradoIndex = Parseado.findIndex(element => element.id === params);

        if (encontradoIndex !== -1) {
            body.id = parseInt(params);
            
            Parseado[encontradoIndex] = {
                ...Parseado[encontradoIndex],
                ...body
            };

            await fs.promises.writeFile(productos, JSON.stringify(Parseado, null, "\t"));

            res.send({ status: "Encontrado" });
        }

})


    app.delete("/delete/product/:id", async(req,res) => {
        const params = parseInt(req.params.id)

        const Productos = await fs.promises.readFile(productos, "utf-8");
        const Parseado = JSON.parse(Productos);

        const encontradoIndex = Parseado.filter(element => element.id !== params);


        await fs.promises.writeFile(productos, JSON.stringify(encontradoIndex, null, "\t"));
    })

app.get("/carrito", (req,res) => {
    res.render("carrito")
})

app.post("/agregar/carrito", async(req,res) => {

    const body = req.body

    const carritos = await fs.promises.readFile(carrito, "utf-8");
    const parseados = JSON.parse(carritos)

    const Productos = await fs.promises.readFile(productos, "utf-8");
    const Parseado = JSON.parse(Productos);

    const filtrar = Parseado.find(element => element.title == req.body.title)

    if(filtrar){
        let info = {
            id: parseados.length + 1,
            products: [body]
        }
    
        parseados.push(info)
        await fs.promises.writeFile(carrito, JSON.stringify(parseados, null, "\t"));
    
        res.send({status:"Agregado al carrito"})
    }else{
        res.send({status:"No se encontro ningun producto"})
    }

})


app.get("/verProductosCarritos/:id", async(req,res) => {

    const params = req.params.id

    const carritos = await fs.promises.readFile(carrito, "utf-8");
    const parseados = JSON.parse(carritos)

    const filter = parseados.find(element => element.id == params)

    const exportar = filter.products[0]
    res.render("carritoviews", {producto: exportar })

    
})

app.post("/:cid/product/:title", async(req,res) => {

    const paramsCarrito = req.params.cid

    const paramsProducto = req.params.title

    const carritos = await fs.promises.readFile(carrito, "utf-8");
    const Productos = await fs.promises.readFile(productos, "utf-8");

    const parseados = JSON.parse(carritos)
    const Parseado = JSON.parse(Productos);


    const findIndex = parseados.findIndex(element => element.id == paramsCarrito)
    if(findIndex !== -1){
        const findProduct = Parseado.findIndex(element => element.title == paramsProducto)
        
        if(findProduct !== -1){
            const carritoEncontrado = parseados[findIndex];
            const productoEncontrado = carritoEncontrado.products.find(product => product.title === paramsProducto);
            if (productoEncontrado) {
                productoEncontrado.cantidad = parseInt(productoEncontrado.cantidad ) + 1;
            } else {
                carritoEncontrado.products.push({ title: paramsProducto, cantidad: 1 });
            }
        }
    }

    await fs.promises.writeFile(carrito, JSON.stringify(parseados, null ,"\t"))

    res.send({status:"Encontrado"})

})