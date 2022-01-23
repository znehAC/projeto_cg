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

let render_list = false
var currentListPositionsArray = [] // usado nos buffers
var currentListColorsArray = [] // usado nos buffers

let render_undeformed = 1
let render_deformed = 1
let render_results = 1

let currentListVertices = [] //armazena as vertices da lista
let currentListColors = [] //armazena as cores de cada vertice da lista

let loaded_list = 1
let resetted = 1

let dragging = false
let mouseX = 0
let mouseY = 0
let keyDown = 0
let lastKeyDown = 0

let rotationGain=1.0
let translationGain= 0.03
let zoomGain= .05

let translateMat = translate(0., 0., -20.)

let rotateMat = mult(rotateX(100), mat4())

let modelViewMatrix = mult(translateMat, rotateMat)

var canvas = document.getElementById("webgl-canvas")
canvas.width = window.innerWidth*0.99
canvas.height = window.innerHeight*0.955
let aspect= canvas.width/canvas.height

let projectionMatrix = perspective(45,aspect,0.5,1000.5)

document.getElementById('inputfile').addEventListener('change', load_file)
let gl = canvas.getContext("webgl2")
canvas.addEventListener("contextmenu", e => e.preventDefault());


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

function toggle_list(){
    render_list = !render_list
    if(render_list){
        
        createList()
        createListElements()
        
        loaded_list = 0
    }
}

function toggle_undeformed(){
    render_undeformed = render_undeformed*-1
}
function toggle_results(){
    render_results = render_results*-1
}
function toggle_deformed(){
    render_deformed = render_deformed*-1
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

    get_lists(file_text[4])
    console.log("LISTS")
    console.log(lists)

    document.getElementById("list-button").style.display = "inline"
    document.getElementById("undeformed-button").style.display = "inline"
    document.getElementById("deformed-button").style.display = "inline"
    document.getElementById("results-button").style.display = "inline"
}

function get_meta(text){
    text = text.split(' ')
    text = text.filter(function(value, index, arr){ 
        return value != ""
    })
    num_vertices = parseFloat(text[0])
    num_elements = parseFloat(text[1])
    num_lists = parseFloat(text[2])
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
        
        x = parseFloat(item[0])
        y = parseFloat(item[1])
        z = parseFloat(item[2])
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
    text = text.split("\n")
    var name = text[1].replace("\r", "")
    text = text.slice(2)
    text = text.filter(function(value, index, arr){ 
        return value != ""
    })

  
    for (let i = 0; i < num_lists; i++) {
        var list = text.slice(i*num_vertices, num_vertices)

        list = list.filter(function(value, index, arr){ 
                    return value != ""
                })

        for (let i = 0; i < list.length; i++) {
            var item = list[i].split(" ")

            item = item.filter(function(value, index, arr){ 
                return value != ""
            })
            for (let j = 0; j < item.length; j++) {
                item[j] = parseFloat(item[j])   
            }
                list[i] = item
        }
                
        lists.push(name)
        lists.push(list)  
    }
}

function createList(){
    getListColors()
    var listName = lists[0]
    var list = lists[1]

    for (let i = 0; i < num_vertices; i++) {
        var vertOffset = list[i]
        var color = vertOffset[3]
        
        vertOffset = vertOffset.slice(0, 3)

        var vert = vertices[i].slice(0, 3)
        var newVert = []

        for (let j = 0; j < 3; j++) {
            newVert[j] = vert[j] + vertOffset[j]
        }
        newVert.push(1)
        newVert = vec4(newVert)
        currentListVertices.push(newVert)
    }
}

function getListColors(){
    var list = lists[1]
    var colorValues = []
    for (let i = 0; i < num_vertices; i++) {
        colorValues.push([i, list[i][3]])
        // colorValues.push([list[i][3], i])
    }
    for (let i = 0; i < num_vertices; i++) {
        currentListColors.push(0)
    }

    colorValues = colorValues.sort((a, b) => b[1] - a[1])

    var j = 0
    var count = 0
    var spaceSize = num_vertices/9

    for (let i = 0; i < num_vertices; i++) {
        currentListColors[colorValues[i][0]] = palette[j]
        count++
        if(count >= spaceSize){
            count = 0
            j++
        }
    }

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
        currentListPositionsArray.push(currentListVertices[wireFace[0]])
        currentListColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
        var wireframeSize = 2


        for(var j = 0; j< wireFace.length; j++)
		{
            currentListPositionsArray.push(currentListVertices[wireFace[j]])
            currentListPositionsArray.push(currentListVertices[wireFace[j]])
            currentListColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
            currentListColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
            wireframeSize += 2
		}

        currentListPositionsArray.push(currentListVertices[wireFace[0]])
        currentListColorsArray.push(vec4(0.7, 0.7, 0.7, 1.0))
        meshVerticesQuantity[i] = wireframeSize


        // SOLID
        var v0 = currentListVertices[solidFace[0]]
        var v0Color = currentListColors[solidFace[0]]
        var triangleSize = 0

        for(var j = 1; j< solidFace.length - 1; j++)
		{
            currentListPositionsArray.push(v0)
            currentListColorsArray.push(v0Color)

            currentListPositionsArray.push(currentListVertices[solidFace[j]])
            currentListColorsArray.push(currentListColors[solidFace[j]])

            currentListPositionsArray.push(currentListVertices[solidFace[j+1]])
            currentListColorsArray.push(currentListColors[solidFace[j + 1]])

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


        // SOLID
        var v0 = vertices[solidFace[0]]
        var triangleSize = 0

        for(var j = 1; j< solidFace.length - 1; j++)
		{
            positionsArray.push(v0)
            colorsArray.push(solidColor)

            positionsArray.push(vertices[solidFace[j]])
            colorsArray.push(solidColor)

            positionsArray.push(vertices[solidFace[j+1]])
            colorsArray.push(solidColor)

            triangleSize += 3
		}

        solidVerticesQuantity[i] = triangleSize

	}
}

function formatElement(element){ //element = type, size, points...
    var type = parseInt(element[0])
    var size = parseInt(element[1])
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
    var type = parseInt(element[0])
    var size = parseInt(element[1])
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

function drag( newMouseX, newMouseY ) {
	var dx = newMouseX - mouseX
	var dy = mouseY - newMouseY
	mouseX = newMouseX
	mouseY = newMouseY
	if(dragging = true){
        if( keyDown == 2 ){
            translateMat = mult(translateMat, translate(0., 0., dy*zoomGain))		
        }else if( keyDown == 1 ){
            translateMat = mult(translateMat, translate(dx * translationGain, dy * translationGain, 0.))	
        }else if(keyDown == 0 ){
            var angle = Math.sqrt( dx*dx + dy*dy )
            var rotation = mat4()

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




if (!gl) {
    console.error("WebGL 2 not available")
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
}
gl.clearColor(0, 0, 0, 1)

gl.enable(gl.DEPTH_TEST)

let vsSource = document.getElementById("vs").text.trim()
let fsSource = document.getElementById("fs").text.trim()
let vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vsSource)
gl.compileShader(vertexShader)
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertexShader))
}
let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fsSource)
gl.compileShader(fragmentShader)
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader))
}
let program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
}
gl.useProgram(program)





function run(){
    createElements() // adiciona no positionsArray a versao wireframe e uma versao solida de cada elemento
    
    let listBuffer = gl.createBuffer()

    let positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW)

    let positionLoc = gl.getAttribLocation( program, "position")
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLoc)

    let listColorBuffer = gl.createBuffer()

    let colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW)

    let colorLoc = gl.getAttribLocation(program, "color")
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(colorLoc)
    
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.polygonOffset(1,1)
    gl.enable(gl.POLYGON_OFFSET_FILL)

    let modelViewProjectionMatrixLoc = gl.getUniformLocation(program, "mvpMatrix")

    let render = function (){
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.clearColor(1.0, 1.0, 1.0, 1.0)

        if(loaded_list == 0 && render_list){ //bind list buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, listColorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListColorsArray), gl.STATIC_DRAW)
            gl.bindBuffer(gl.ARRAY_BUFFER, listBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(currentListPositionsArray), gl.STATIC_DRAW)
            loaded_list = 1
        }
        modelViewMatrix = setMatrix()   
        modelViewProjection = mult(projectionMatrix, modelViewMatrix)
        
        gl.uniformMatrix4fv(modelViewProjectionMatrixLoc,false,flatten(modelViewProjection))
        
        //DRAWING EACH ELEMENT
        for(var j = 0; j < num_elements; j++){
            var wireSize = meshVerticesQuantity[j]
            var solidSize = solidVerticesQuantity[j]
            
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
            gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)

            if(render_undeformed == 1)
                gl.drawArrays(gl.LINES,j*(wireSize + solidSize), wireSize)
            // gl.drawArrays(gl.TRIANGLES,j*(wireSize + solidSize) + wireSize, solidSize)

            if(render_list && loaded_list == 1){

                gl.bindBuffer(gl.ARRAY_BUFFER, listBuffer)
                gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)

                gl.bindBuffer(gl.ARRAY_BUFFER, listColorBuffer)
                gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
                if(render_deformed == 1)
                    gl.drawArrays(gl.LINES,j*(wireSize + solidSize), wireSize)
                if(render_results == 1)
                    gl.drawArrays(gl.TRIANGLES,j*(wireSize + solidSize) + wireSize, solidSize)
            }
        }
        
        requestAnimationFrame(render)
    }

    render ()
}