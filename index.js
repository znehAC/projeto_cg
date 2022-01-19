let num_vertices = 0
let num_elements = 0
let num_lists = 0
let vertices = []
let elements = []
let lists = {}
let meshVerticesQuantity = [] //quantidade de vertices para cada elemento em wireframe
let solidVerticesQuantity = [] //quantidade de vertices para cada elemento em solido

let positionsArray = []
let colorsArray = []
let wireColor = vec4(1.0, 0.0, 0.0, 1.0)
let solidColor = vec4(0.9, 0.9, 0.9, 1.0)

let dragging = false
let mouseX = 0
let mouseY = 0
let keyDown = 0

let rotationGain=1.0
let translationGain= 0.03
let zoomGain= .05

let translateMat = translate(0., 0., -20.)

let rotateMat = mult(rotateX(100), mat4())

let modelViewMatrix = mult(translateMat, rotateMat)

var canvas = document.getElementById("webgl-canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let aspect= canvas.width/canvas.height

let projectionMatrix = perspective(45,aspect,0.5,1000.5)

document.getElementById('inputfile').addEventListener('change', load_file)

document.onkeydown = handleKeyDown
document.onkeyup = handleKeyUp
canvas.addEventListener('mousedown', mouseDown, true)
canvas.addEventListener('mousemove', mouseMove, true)
canvas.addEventListener('mouseup', mouseUp, true)

function load_example(){
    console.log("asasdfasdfdsa");
    console.log(self.location.host);
    fetch(`http://${self.location.host}/example.ogl`).then(response => response.text()).then((data) => {
        procces_file(data)
        run()
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

function procces_file(file){
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
    var name = text[1]
    lists[name] = []
    text = text.slice(2)

    text.forEach(item => {
        item = item.split(" ")
        item = item.filter(function(value, index, arr){ 
            return value != ""
        })

        lists[name].push(item)
    })

}

function createElements(){ //cria o array de vertices para fazer um wireframe
    positionsArray = []
    colorsArray = []
    for(var i = 0; i < elements.length; i++)
	{
        var face = elements[i]
        face = formatElement(face)
        console.log("isso que chegou", face)
        //WIREFRAME
        positionsArray.push(vertices[face[0]])
        colorsArray.push(wireColor)
        var wireframeSize = 2


        for(var j = 0; j< face.length; j++)
		{
            positionsArray.push(vertices[face[j]])
            positionsArray.push(vertices[face[j]])
            colorsArray.push(wireColor)
            colorsArray.push(wireColor)
            wireframeSize += 2
		}

        positionsArray.push(vertices[face[0]])
        colorsArray.push(wireColor)
        meshVerticesQuantity[i] = wireframeSize


        // SOLID
        var v0 = vertices[face[0]]
        var triangleSize = 0

        for(var j = 1; j< face.length - 1; j++)
		{
            positionsArray.push(v0)
            colorsArray.push(solidColor)

            positionsArray.push(vertices[face[j]])
            colorsArray.push(solidColor)

            positionsArray.push(vertices[face[j+1]])
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
        // console.log(skipSize)
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

    console.log("isso que ta saindo")
    console.log(wireframeArray)
    return wireframeArray
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
        if(keyDown == 0 ){
            var angle = Math.sqrt( dx*dx + dy*dy )
            var rotation = mat4()

            rotation = rotate(degToRad(angle*10), [-dy, dx, 0])
            rotateMat = mult(rotation, rotateMat)

        }
        else if( keyDown== 1 ){
            translateMat = mult(translateMat, translate(dx * translationGain, dy * translationGain, 0.))	
        }
        else if( keyDown == 2 ){
            translateMat = mult(translateMat, translate(0., 0., dy*zoomGain))		
        }
    }
	
}

function mouseDown(event) {
	dragging = true
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
    if(keyDown == 0){
        if(event.keyCode == 17 ){
            keyDown = 1
            console.log("holding ctrl")
        }
        else if(event.keyCode == 16 ){
            keyDown = 2
            console.log("holding shift")
        }
    }
}

function handleKeyUp(event){
	if(event.keyCode == 17 ){
        console.log("lifting ctrl")
		keyDown = 0
	}
	else if(event.keyCode == 16 ){
        console.log("lifting shift")
		keyDown = 0
	}
}



let gl = canvas.getContext("webgl2")
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

    console.log(positionsArray)
    let positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW)
    let positionLoc = gl.getAttribLocation( program, "position")
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLoc)


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
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.clearColor(1.0, 1.0, 1.0, 1.0)

        modelViewMatrix = setMatrix()   
        modelViewProjection = mult(projectionMatrix, modelViewMatrix)
        
        gl.uniformMatrix4fv(modelViewProjectionMatrixLoc,false,flatten(modelViewProjection))
        
        //DRAWING EACH ELEMENT
        for(var j = 0; j < num_elements; j++){
            var wireSize = meshVerticesQuantity[j]
            var solidSize = solidVerticesQuantity[j]

            gl.drawArrays(gl.LINES,j*(wireSize + solidSize), wireSize)
            gl.drawArrays(gl.TRIANGLES,j*(wireSize + solidSize) + wireSize, solidSize)
        }
        
        requestAnimationFrame(render)
    }

    render ()
}