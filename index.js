var palette = [
    vec4(0.0, 0.0, 1.0, 1.0),
    vec4(0.0, 0.3, 1.0, 1.0),
    vec4(0.0, 0.6, 1.0, 1.0),
    vec4(0.0, 0.8, 1.0, 1.0),
    vec4(0.0, 1.0, 0.0, 1.0),
    vec4(1.0, 0.8, 0.0, 1.0),
    vec4(1.0, 0.6, 0.0, 1.0),
    vec4(1.0, 0.3, 0.0, 1.0),
    vec4(1.0, 0.0, 0.0, 1.0)
]

var intervals = []
var intervalSize
let num_vertices = 0
let num_elements = 0
let num_lists = 0
let vertices = []
let elements = []
let lists = []
let meshVerticesQuantity = [] //quantidade de vertices para cada elemento em wireframe
let solidVerticesQuantity = [] //quantidade de vertices para cada elemento em solido
let positionsArray = []
let colorsArray = []
let wireColor = vec4(0.0, 0.0, 0.0, 1.0)
let solidColor = vec4(0.9, 0.9, 0.9, 1.0)
let listColor = vec4(0.0, 0.6, 0.0, 1.0)
let labelPositionsArray = []
let labelColorsArray = []
let texCoordsArray = [];

let render_list = false
var currentListWireframePositionsArray = [] // dados do buffer de vertices do wireframe
var currentListSolidPositionsArray = [] // dados do buffer de vertices das faces
var currentListWireframeColorsArray = [] // buffer de cores
var currentListSolidColorsArray = [] // buffer de cores

let currentListIndex = -1
let render_undeformed = 1
let render_deformed = 1
let render_results = 1
let render_numbers = -1
let render_points = 1


let currentListVertices = [] //armazena as vertices da lista
let currentListColors = [] //armazena as cores de cada vertice da lista

let loaded_list = 1
let resetted = 1
let deformationScale = document.getElementsByClassName("quantity-field")[0].value

let dragging = false
let mouseX = 0
let mouseY = 0
let keyDown = 0
let lastKeyDown = 0

let rotationGain= 1.0
let translationGain= 0.012
let zoomGain= .01
let rotation = 0
let translateMat = translate(0., 0., 0.)



let rotateMat = mat4()

let modelViewMatrix = mult(translateMat, rotateMat)

// let textModelViewMatrix = mult(translateMat, rotateX(190))
let textTranslateMat = translateMat
let textRotateMat = rotateX(190)

var canvas = document.getElementById("webgl-canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight*0.975
let aspect= canvas.width/canvas.height

let labelOffsetX = 0.08/aspect
let labelOffsetY = 0.095/aspect

let orthoScale = 5.0
let scaleFactor = canvas.width/canvas.height
// let projectionMatrix = perspective(45,aspect,0.5,1000.5)
let projectionMatrix = ortho(-orthoScale*scaleFactor, orthoScale*scaleFactor, -orthoScale, orthoScale, 0.5, 1000.5)
// let textProjectionMatrix = perspective(10, aspect, 0.5, 1000.5)



document.getElementById('inputfile').addEventListener('change', load_file)

canvas.addEventListener("contextmenu", e => e.preventDefault());

document.getElementsByClassName("button-minus")[0].addEventListener('click', function(e){decrementValue(e)})
document.getElementsByClassName("button-plus")[0].addEventListener('click', function(e){incrementValue(e)})
// document.getElementsByClassName("quantity-field")[0].addEventListener('change', function(e){update_deformationScale(e)})

document.onkeydown = handleKeyDown
document.onkeyup = handleKeyUp
canvas.addEventListener('mousedown', mouseDown, true)
canvas.addEventListener('mousemove', mouseMove, true)
canvas.addEventListener('mouseup', mouseUp, true)

function reset(){
    num_vertices = 0
    num_elements = 0
    num_lists = 0
    vertices = []
    elements = []
    lists = []
    meshVerticesQuantity = []
    solidVerticesQuantity = []
    positionsArray = []
    colorsArray = []
    render_list = false
    currentListPositionsArray = []
    currentListColorsArray = []
    currentListVertices = []
    currentListColors = []
    loaded_list = 1
    translateMat = translate(0., 0., -20.)
    rotateMat = mult(rotateX(100), mat4())
    modelViewMatrix = mult(translateMat, rotateMat)
}

function load_example(){
    console.log(self.location.host);
    fetch(`https://${self.location.host}/${self.location.pathname}/example.ogl`).then(response => {
        if( response.ok){
            return response.text()
        }else{
            throw new Error("server is not https")
        }
    }).then((data) => {
        procces_file(data)
        run()
    }).catch( (error) => {
        fetch(`http://${self.location.host}/example.ogl`).then(response => response.text()).then((data) => {
            procces_file(data)
            run()
        })
    })
}

function load_file(){
    var fr=new FileReader()
    fr.onload=function(){
        file = fr.result
        procces_file(file)
        
        run()
    }
    fr.readAsText(this.files[0])
}

function toggle_list(index){
    if(index == currentListIndex){
        render_list = false
        currentListIndex = -1
    }
    else
        render_list = true
    if(render_list){
        currentListIndex = index
        createList(index)
        createListElements(index)
        
        loaded_list = 0
    }
    // document.getElementById('list-button').style.display = 'none'
}

function toggle_undeformed(){
    render_undeformed = render_undeformed*-1
    if (render_undeformed < 0) 
        document.getElementById('undeformed-button').innerText = 'Mostrar mesha'
    else
        document.getElementById('undeformed-button').innerText = 'Esconder mesha'   
}
function toggle_results(){
    render_results = render_results*-1
    if (render_results < 0) 
        document.getElementById('results-button').innerText = 'Mostrar resultados'
    else
        document.getElementById('results-button').innerText = 'Esconder resultados'   
}

function toggle_deformed(){
    render_deformed = render_deformed*-1
    if (render_deformed < 0) 
        document.getElementById('deformed-button').innerText = 'Mostrar mesha deformada'
    else
        document.getElementById('deformed-button').innerText = 'Esconder mesha deformada'    
}
function toggle_numbers(){
    render_numbers = render_numbers*-1
    if (render_numbers < 0) 
        document.getElementById('numbers-button').innerText = 'Mostrar números'
    else
        document.getElementById('numbers-button').innerText = 'Esconder números'    
}

function toggle_points(){
    render_points = render_points*-1
    if (render_points < 0) 
        document.getElementById('points-button').innerText = 'Mostrar pontos'
    else
        document.getElementById('points-button').innerText = 'Esconder pontos'    
}

function incrementValue(e) {
    e.preventDefault();
    var fieldName = $(e.target).data('field');
    var parent = $(e.target).closest('div');
    var currentVal = parseInt(parent.find('input[name=' + fieldName + ']').val(), 10);

    if (!isNaN(currentVal)) {
        parent.find('input[name=' + fieldName + ']').val(currentVal + 1);
        deformationScale = currentVal + 1
    } else {
        deformationScale = 1
        parent.find('input[name=' + fieldName + ']').val(1);
    }
    console.log(deformationScale);
}
  
function decrementValue(e) {
    e.preventDefault();
    var fieldName = $(e.target).data('field');
    var parent = $(e.target).closest('div');
    var currentVal = parseInt(parent.find('input[name=' + fieldName + ']').val(), 10);

    if (!isNaN(currentVal) && currentVal > 1) {
        parent.find('input[name=' + fieldName + ']').val(currentVal - 1);
        deformationScale = currentVal - 1
    } else {
        deformationScale = 1   
        parent.find('input[name=' + fieldName + ']').val(1);
    }
    console.log(deformationScale);
}

function apply_scale(){
    deformationScale = Number(document.getElementsByClassName("quantity-field")[0].value)
    console.log(deformationScale);
    if(currentListIndex != -1){
        currentListColors = []
        currentListVertices = []
        currentListSolidColorsArray = []
        currentListSolidPositionsArray = []
        currentListWireframeColorsArray = []
        currentListWireframePositionsArray = []
        createList(currentListIndex)
        createListElements(currentListIndex)
    }
    
    loaded_list = 0
}

function update_deformationScale(e){
    console.log("ativou evento");
    // e.preventDefault();
    var fieldName = $(e.target).data('field');
    var parent = $(e.target).closest('div');
    var currentVal = parseInt(parent.find('input[name=' + fieldName + ']').val(), 10);
    // deformationScale = currentVal
}


function procces_file(file){
    reset()
    var file_text = file.split('#')
    var meta = file_text[1].split('\n')[1]
    
    get_meta(meta)
    console.log("INFO")
    console.log(num_vertices)
    console.log(num_elements)
    console.log(num_lists)
    
    get_vertices(file_text[2])
    console.log("VERTICES")
    console.log(vertices)

    
    get_elements(file_text[3])
    console.log("ELEMENTS")
    console.log(elements)

    
    get_lists(file_text.slice(4))
    console.log("LISTS")
    console.log(lists)
    load_listText()


    document.getElementById('example-button').style.display = 'none'
    document.getElementById("undeformed-button").style.display = "inline"
    document.getElementById("deformed-button").style.display = "inline"
    document.getElementById("results-button").style.display = "inline"
    document.getElementById("numbers-button").style.display = "inline"
    document.getElementById("points-button").style.display = "inline"
}

function load_listText() {
    var parent = document.getElementById("list-block")

    for (let i = 0; i < num_lists; i++) {
        var listName = lists[i*2]

        var listItem = document.createElement("a");
        listItem.style.margin = "3px"
        listItem.innerText = listName
        listItem.id = i
        listItem.addEventListener("click", ev => {clicked(ev)})
        parent.appendChild(listItem)
    }
}

function clicked(event){
    // console.log(event.target.id, "clicked");
    currentListColors = []
    currentListVertices = []
    currentListSolidColorsArray = []
    currentListSolidPositionsArray = []
    currentListWireframeColorsArray = []
    currentListWireframePositionsArray = []
    toggle_list(event.target.id)
}

function get_meta(text){
    text = text.split(' ')
    text = text.filter(function(value, index, arr){ 
        return value != ""
    })
    num_vertices = Number(text[0])
    num_elements = Number(text[1])
    num_lists = Number(text[2])
}

function get_vertices(text){
    text = text.split("\n")
    text = text.slice(1, num_vertices+1)
    var x = 0
    var y = 0
    var z = 0

    text.forEach(item => {
        item = item.split(" ")
        item = item.filter(function(value, index, arr){ 
            return value != ""
        })
        
        x = Number(item[0])
        y = Number(item[1])
        z = Number(item[2])
        vertices.push( vec4(x, y, z, 1.0) )
        
    })
}

function get_elements(text){
    text = text.split("\n")
    text = text.slice(1, num_elements+1)
    

    text.forEach(item => {
        item = item.split(" ")
        item = item.filter(function(value, index, arr){ 
            return value != "" && value != "\r"
        })
        
        var element = []
        var x = 0
        item.forEach(i => {
            if(x < 2)
                element.push(i)
            else
                element.push(i-1)
            x++
        })
        var vert_quant = get_vertices_quantity(element[1], element[0])
        
        element = element.slice(0, vert_quant+2)
        elements.push(element)
    })
}

function get_vertices_quantity(size, type){
    var quantity = 3
    if(type == 2){
        for(var i = 1; i < size; i++){
            quantity = quantity + 3 + i-1
        }
    }

    return quantity
}

function get_lists(text){
    for (let i = 0; i < num_lists; i++) {
        get_list(text[i])
        
    }
}

function get_list(text){
    text = text.split("\n")
    var name = text[1].replace("\r", "")
    text = text.slice(2)
    text = text.filter(function(value, index, arr){ 
        return value != ""
    })
    
    var list = text.slice(0, num_vertices)

    list = list.filter(function(value, index, arr){ 
                return value != ""
            })

    for (let i = 0; i < list.length; i++) {
        item = list[i].split(" ").filter(function(value, index, arr){ 
            return value != ""
        })

        for (let j = 0; j < item.length; j++) {
            item[j] = Number(item[j])
            
        }
        list[i] = item
    }

    lists.push(name)
    lists.push(list)
}

function createList(index){
    getListColors(index)
    var listName = lists[index*2]
    var list = lists[index*2+1]
    var newListVertices = []
    for (let i = 0; i < num_vertices; i++) {
        var vertOffset = list[i]
        var color = vertOffset[3]
        
        vertOffset = vertOffset.slice(0, 3)

        var vert = vertices[i].slice(0, 3)
        var newVert = []

        for (let j = 0; j < 3; j++) {
            newVert[j] = vert[j] + vertOffset[j]*deformationScale
        }
        newVert.push(1)
        newVert = vec4(newVert)
        newListVertices.push(newVert)
    }
    currentListVertices = newListVertices
}

function getListColors(index){
    var list = lists[index*2+1]
    var colorValues = []
    var newListColors = []
    for (let i = 0; i < num_vertices; i++) {
        colorValues.push([i, list[i][3]])
        // colorValues.push([list[i][3], i])
    }
    for (let i = 0; i < num_vertices; i++) {
        newListColors.push(0)
    }

    colorValues = colorValues.sort((a, b) => b[1] - a[1])

    var j = 0
    var count = 0
    var spaceSize = num_vertices/9

    for (let i = 0; i < num_vertices; i++) {
        newListColors[colorValues[i][0]] = palette[j]
        count++
        if(count >= spaceSize){
            count = 0
            j++
        }
    }
    currentListColors = newListColors

}

function createListElements(){
    currentListPositionsArray = []
    currentListColorsArray = []

    for(var i = 0; i < elements.length; i++)
	{
        var face = elements[i]
        var solidFace = formatElementSolid(face)
        var wireFace = formatElement(face)
        //WIREFRAME
        currentListWireframePositionsArray.push(currentListVertices[wireFace[0]])
        currentListWireframeColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
        var wireframeSize = 2
        
        
        for(var j = 0; j< wireFace.length; j++)
		{
            currentListWireframePositionsArray.push(currentListVertices[wireFace[j]])
            currentListWireframePositionsArray.push(currentListVertices[wireFace[j]])
            currentListWireframeColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
            currentListWireframeColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
            wireframeSize += 2
		}
        
        currentListWireframePositionsArray.push(currentListVertices[wireFace[0]])
        currentListWireframeColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
        meshVerticesQuantity[i] = wireframeSize
        
        
        // var wireframeVertices = getOffsetedListVertices()
        // SOLID
        var v0 = currentListVertices[solidFace[0]]
        var v0Color = currentListColors[solidFace[0]]
        var triangleSize = 0

        for(var j = 1; j< solidFace.length - 1; j++)
		{
            currentListSolidPositionsArray.push(v0)
            currentListSolidColorsArray.push(v0Color)

            currentListSolidPositionsArray.push(currentListVertices[solidFace[j]])
            currentListSolidColorsArray.push(currentListColors[solidFace[j]])

            currentListSolidPositionsArray.push(currentListVertices[solidFace[j+1]])
            currentListSolidColorsArray.push(currentListColors[solidFace[j + 1]])

            triangleSize += 3
		}

        solidVerticesQuantity[i] = triangleSize

	}
}

function createElements(){ //cria o array de vertices para fazer um wireframe
    positionsArray = []
    colorsArray = []
    for(var i = 0; i < elements.length; i++)
	{
        var face = elements[i]
        var solidFace = formatElementSolid(face)
        var wireFace = formatElement(face)

        //WIREFRAME
        positionsArray.push(vertices[wireFace[0]])
        colorsArray.push(wireColor)
        var wireframeSize = 2


        for(var j = 0; j< wireFace.length; j++)
		{
            positionsArray.push(vertices[wireFace[j]])
            positionsArray.push(vertices[wireFace[j]])
            colorsArray.push(wireColor)
            colorsArray.push(wireColor)
            wireframeSize += 2
		}

        positionsArray.push(vertices[wireFace[0]])
        colorsArray.push(wireColor)
        meshVerticesQuantity[i] = wireframeSize


        // // SOLID
        // var v0 = vertices[solidFace[0]]
        // var triangleSize = 0

        // for(var j = 1; j< solidFace.length - 1; j++)
		// {
        //     positionsArray.push(v0)
        //     colorsArray.push(solidColor)

        //     positionsArray.push(vertices[solidFace[j]])
        //     colorsArray.push(solidColor)

        //     positionsArray.push(vertices[solidFace[j+1]])
        //     colorsArray.push(solidColor)

        //     triangleSize += 3
		// }

        // solidVerticesQuantity[i] = triangleSize

	}
}

function formatElement(element){ //element = type, size, points...
    var type = Number(element[0])
    var size = Number(element[1])
    var points = element.slice(2)

    var wireframeArray = []

    if(type == 2 && size > 1){
        
        var loopLength = (size-1)*2+1
        var skipSize = size +1

        for (let i = 0; i < size+1; i++) {
            wireframeArray.push(points[i])       
        }
        wireframeArray = wireframeArray.reverse()
        var j = size+1
        for (let w = 0; w < loopLength; w++) {
            wireframeArray.push(points[j])
            
            skipSize--
            if(skipSize == 1){
                skipSize = -1
            }
            j += skipSize
        }    

    }else{
        wireframeArray = points
    }

    return wireframeArray
}

function formatElementSolid(element){ //element = type, size, points...
    var type = Number(element[0])
    var size = Number(element[1])
    var points = element.slice(2)

    var triangleArray = []

    if(type == 2 && size > 1){
        
        
        let limit = size
        let count = 0
        let offset = size+1
        let skip = 1
        triangleArray.push(points[0])

        for (let i = 0; limit >= 1; i += skip) {
            if(count == limit){
                
                if(skip == 1){
                    triangleArray.push(points[i+offset-1])
                    i = i+offset-1 + 1
                    offset = offset - 2
                }
                else{
                    triangleArray.push(points[i+offset+1])
                    i = i+offset+1 - 1
                }
                    
                
                skip = skip*-1
                count = 0
                limit --
                
            }else{
                triangleArray.push(points[i+offset])
                triangleArray.push(points[i+skip])
                count++
            }

            if(limit == 0)
                break
        }
        triangleArray = triangleArray.slice(0, triangleArray.length-1)
    }else{
        triangleArray = points
    }
    return triangleArray
}

function startDragging( newMouseX, newMouseY ) {
	mouseX = newMouseX
	mouseY = newMouseY
}

function degToRad(degrees) {
	return degrees * Math.PI / 180
}

function setMatrix(){
	return  mult(translateMat, rotateMat)
}

function drag( newMouseX, newMouseY) {
	var dx = newMouseX - mouseX
	var dy = mouseY - newMouseY


    if(dx == 0 && dy == 0) return

	mouseX = newMouseX
	mouseY = newMouseY
	if(dragging = true){
        if( keyDown == 2 ){
            textTranslateMat = mult(textTranslateMat, translate(0., 0., dy*zoomGain))	
            if(orthoScale >= 0){
                orthoScale = orthoScale - dy*zoomGain
                if(orthoScale < 0) orthoScale = 0
            }
            
            projectionMatrix = 	ortho(-orthoScale*scaleFactor, orthoScale*scaleFactor, -orthoScale, orthoScale, 0.1, 100.)

        }else if( keyDown == 1 ){
            translateMat = mult(translateMat, translate(dx * translationGain, dy * translationGain, 0.))	
        }else if(keyDown == 0 ){
            var angle = Math.sqrt( dx*dx + dy*dy )

            rotation = rotate(degToRad(angle*10), [-dy, dx, 0])
            rotateMat = mult(rotation, rotateMat)
        }
    }
}

function mouseDown(event) {
	dragging = true
    if(keyDown != 2){
        if(event.button == 2 ){
            keyDown = 1
        }else{
            keyDown = 0
        }
    }
	startDragging(event.clientX,event.clientY)
}

function mouseUp() {
	dragging = false
}

function mouseMove(event) {
	if (dragging) {
		drag(event.clientX, event.clientY)
	}
}

function handleKeyDown(event){
    if(event.keyCode == 16 && keyDown != 2){
        lastKeyDown = keyDown
        keyDown = 2
        console.log("holding shift")
    }
}

function handleKeyUp(event){
	if(event.keyCode == 16 ){
        console.log("lifting shift")
		keyDown = lastKeyDown
	}
}

function generateQuad(a, b, c, d){
    verts = []
    verts.push(a)
    texCoordsArray.push(texCoord[1])
    verts.push(b)
    texCoordsArray.push(texCoord[2])
    verts.push(c)
    texCoordsArray.push(texCoord[3])
    verts.push(c)
    texCoordsArray.push(texCoord[3])
    verts.push(a)
    texCoordsArray.push(texCoord[1])
    verts.push(d)
    texCoordsArray.push(texCoord[0])
    return verts
}

function generateLabelsPositions(){
    labelPositionsArray = []
    labelColorsArray = []
    texCoordsArray = []
    labelSize = 0.1


    for (let i = 0; i < num_vertices; i++) {
        vert = vertices[i]
        x = vert[0]
        y = vert[1]
        z = vert[2]

        a = vec4(-labelOffsetX, 0.0, 0.0, 0.0)
        b = vec4(labelOffsetX, 0.0, 0.0, 0.0)
        c = vec4(labelOffsetX, labelOffsetY, 0.0, 0.0)
        d = vec4(-labelOffsetX, labelOffsetY, 0.0, 0.0)
        
        quad = generateQuad(a, b, c, d)
        
        labelPositionsArray = labelPositionsArray.concat(quad)
        for (let j = 0; j < 6; j++) {
            labelColorsArray.push(vec4(0.3, 0.3, 0.3, 0.0))
        }
        
    }
}

// ==============================================
let gl = canvas.getContext("webgl2")

if (!gl) {
    console.error("WebGL 2 not available")
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
}


gl.clearColor(1.0, 1.0, 1.0, 1.0)
gl.enable(gl.DEPTH_TEST)

var program = initShaders(gl, "vs", "fs")
var textProgram = initShaders(gl, "text-vertex-shader", "text-fragment-shader")

gl.useProgram(program)

var textCtx = document.createElement("canvas").getContext("2d");

function makeTextCanvas(text, width, height) {
  textCtx.canvas.width  = width;
  textCtx.canvas.height = height;
  textCtx.font = "20px monospace";
  textCtx.textAlign = "center";
  textCtx.textBaseline = "middle";
  textCtx.fillStyle = "red";
  textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
  textCtx.fillText(text, width / 2, height / 2);
  return textCtx.canvas;
}

const texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0),
];

let textures = []

function preLoadTextures(){
    gl.useProgram(textProgram)
    for (let i = 1; i <= num_vertices; i++) {
        var textCanvas = makeTextCanvas(i, 100, 20);
        textures[i-1] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, textures[i-1]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    }
}

function run(){
    createElements() // adiciona no positionsArray a versao wireframe e uma versao solida de cada elemento
    generateLabelsPositions()
    preLoadTextures()
    let listSolidBuffer = gl.createBuffer()
    let listWireframeBuffer = gl.createBuffer()

    let pointPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)

    let positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW)

    let labelPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, labelPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(labelPositionsArray), gl.STATIC_DRAW)

    let labelColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, labelColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(labelColorsArray), gl.STATIC_DRAW)

    let positionLoc = gl.getAttribLocation( program, "position")
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLoc)

    let listSolidColorBuffer = gl.createBuffer()
    let listWireframeColorBuffer = gl.createBuffer()

    let colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW)

    let colorLoc = gl.getAttribLocation(program, "color")
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(colorLoc)
    
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.polygonOffset(1,1)
    gl.enable(gl.POLYGON_OFFSET_FILL)

    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
    let texCoordLoc = gl.getAttribLocation(textProgram, "texCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);


    let modelViewProjectionMatrixLoc = gl.getUniformLocation(program, "mvpMatrix")
    let textModelViewProjectionMatrixLoc = gl.getUniformLocation(textProgram, "mvpMatrix")
    // let textModelViewProjectionMatrix2Loc = gl.getUniformLocation(textProgram2, "mvpMatrix")
    let textCenterLoc = gl.getUniformLocation(textProgram, "centerPoint")

    let render = function (){
        // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight*0.95
        aspect= canvas.width/canvas.height
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.clearColor(1.0, 1.0, 1.0, 1.0)

        gl.disable(gl.BLEND);
        gl.depthMask(true);
        if(loaded_list == 0 && render_list){ //bind list buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, listWireframeColorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListWireframeColorsArray), gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, listSolidColorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListSolidColorsArray), gl.STATIC_DRAW)

            gl.bindBuffer(gl.ARRAY_BUFFER, listWireframeBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListWireframePositionsArray), gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, listSolidBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListSolidPositionsArray), gl.STATIC_DRAW)

            loaded_list = 1
        }
        modelViewMatrix = setMatrix()   
        modelViewProjection = mult(projectionMatrix, modelViewMatrix)

        gl.useProgram(program)
        gl.uniformMatrix4fv(modelViewProjectionMatrixLoc,false,flatten(modelViewProjection))
        
        //DRAWING EACH ELEMENT
        for(var j = 0; j < num_elements; j++){
            var wireSize = meshVerticesQuantity[j]
            var solidSize = solidVerticesQuantity[j]

            //================ DRAWN MAIN WIREFRAME ====================
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
            gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)

            if(render_undeformed == 1)
                gl.drawArrays(gl.LINES,j*(wireSize), wireSize)
            
            //================ DRAWN DEFORMATIONS ====================
            if(render_list && loaded_list == 1){
                if(render_deformed == 1){
                    gl.bindBuffer(gl.ARRAY_BUFFER, listWireframeBuffer)
                    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
                    
                    gl.bindBuffer(gl.ARRAY_BUFFER, listWireframeColorBuffer)
                    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
                    
                    gl.drawArrays(gl.LINES,j*(wireSize), wireSize)
                }
                if(render_results == 1){
                    gl.bindBuffer(gl.ARRAY_BUFFER, listSolidBuffer)
                    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
                    
                    gl.bindBuffer(gl.ARRAY_BUFFER, listSolidColorBuffer)
                    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
                    
                    gl.drawArrays(gl.TRIANGLES,j*(solidSize), solidSize)
                }
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer)
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
        if(render_points == 1){
            for(var w = 0; w < num_vertices; w++){
                gl.drawArrays(gl.POINTS, w, 1)
            }
        }


        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        // gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.useProgram(textProgram)
        gl.uniformMatrix4fv(textModelViewProjectionMatrixLoc,false,flatten(modelViewProjection))

        gl.bindBuffer(gl.ARRAY_BUFFER, labelPositionBuffer)
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, labelColorBuffer)
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

        // //================ DRAWN LABELS =======================
        if(render_numbers == 1){
            for(var w = 0; w < num_vertices; w++){
                // var textTex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, textures[w]); 
    
                vert = vertices[w]
        
                gl.uniform4fv(textCenterLoc, vert)
    
                gl.drawArrays(gl.TRIANGLES, w * 6, 6)
            }
        }

        requestAnimationFrame(render)
    }

    render ()
}