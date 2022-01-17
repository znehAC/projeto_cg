let file = ''
let num_vertices = 0
let num_elements = 0
let num_lists = 0
let vertices = []
let elements = []
let lists = {}
let meshVerticesQuantity = [] //quantidade de vertices para cada elemento em wireframe
let solidVerticesQuantity = [] //quantidade de vertices para cada elemento em solido
document.getElementById('inputfile').addEventListener('change', load_file)

function load_file(){
    var fr=new FileReader();
    fr.onload=function(){
        file = fr.result;
        procces_file()
        run()
    }
    fr.readAsText(this.files[0]);
}

function procces_file(){
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
        return value != "";
    });
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
            return value != "";
        });
        
        x = parseFloat(item[0])
        y = parseFloat(item[1])
        z = parseFloat(item[2])
        vertices.push( vec4(x, y, z, 1.0) )
        
    });
}

function get_elements(text){
    text = text.split("\n")
    text = text.slice(1, num_elements+1)
    
  
    text.forEach(item => {
        item = item.split(" ")
        item = item.filter(function(value, index, arr){ 
            return value != "" && value != "\r";
        });
        
        var element = []
        var x = 0
        item.forEach(i => {
            if(x < 2)
                element.push(i)
            else
                element.push(i-1)
            x++
        });

        elements.push(element)
    });
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
            return value != "";
        });

        lists[name].push(item)
    });

}

function createElements(){ //cria o array de vertices para fazer um wireframe
    positionsArray = []
    colorsArray = []
    for(var i = 0; i < elements.length; i++)
	{
        var face = elements[i]
        face = formatElement(face)

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
    // points = points.concat(points.reverse().slice(2))
    console.log("points");
    console.log(points);
    var wireframeArray = []

    if(type == 2 && size > 1){
        
        var loopLength = (size-1)*2+1
        var skipSize = size +1
        // console.log(skipSize);
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

    console.log("wireframearray");
    console.log(wireframeArray)
    return wireframeArray
}





let canvas = document.getElementById("webgl-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let aspect= canvas.width/canvas.height;
let eye,at,up;
let modelViewProjection;
let gl = canvas.getContext("webgl2");
if (!gl) {
    console.error("WebGL 2 not available");
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
}
gl.clearColor(0, 0, 0, 1);

gl.enable(gl.DEPTH_TEST);

let vsSource = document.getElementById("vs").text.trim();
let fsSource = document.getElementById("fs").text.trim();
let vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertexShader));
}
let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader));
}
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

let positionsArray = []
let colorsArray = []
let wireColor = vec4(1.0, 0.0, 0.0, 1.0)
let solidColor = vec4(0.9, 0.9, 0.9, 1.0)


function run(){
    // formatElement(elements[0])
    createElements() // adiciona no positionsArray a versao wireframe e uma versao solida de cada elemento

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    let positionLoc = gl.getAttribLocation( program, "position");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);


    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    let colorLoc = gl.getAttribLocation(program, "color");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
    
    ////////////////
    // DRAW
    ////////////////
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.polygonOffset(1,1);
    gl.enable(gl.POLYGON_OFFSET_FILL);

    let modelViewProjectionMatrixLoc = gl.getUniformLocation(program, "mvpMatrix");
    let i=0;

    let render = function (){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.clearColor(1.0, 1.0, 1.0, 1.0)

        eye=vec3(0,0,13.5);
        up=vec3(0,1,0);
        at=vec3(0,0,0);
        modelViewMatrix = mult(lookAt(eye,at,up),rotateX(i));
        i=(i+1) % 360;
        projectionMatrix = perspective(45,aspect,0.5,100.5);
        modelViewProjection = mult(projectionMatrix,modelViewMatrix);
        gl.uniformMatrix4fv(modelViewProjectionMatrixLoc,false,flatten(modelViewProjection));
        
        //DRAWING EACH ELEMENT
        for(var j = 0; j < num_elements; j++){
            var wireSize = meshVerticesQuantity[j]
            var solidSize = solidVerticesQuantity[j]
            var size = elements[j][1]
            gl.drawArrays(gl.LINES,j*(wireSize + solidSize), wireSize)
            gl.drawArrays(gl.TRIANGLES,0+j*(wireSize + solidSize) + wireSize, solidSize)
        }
        
        requestAnimationFrame(render);
    }

    render ();
}


// function create_object(){
//     elements.forEach(element => {
//         var type = element[0]
//     // create_triangle_outline(elements[0][1], elements[0].slice(2))
//         if(type == 2){
//             create_triangle_outline(element[1], element.slice(2))
//         }

//     });
// }

// function elementsArrayToVertices(){
//     for(var i = 0; i < num_elements; i++){
//         var element = elements[i]

//         var type = element[0]
//         var size = element[1]

//         var vertsIndex = element.slice(2)
//         var verts = []

//         vertsIndex.forEach(index => {
//             verts.push(vertices[index])
//         });

//         meshArray.push(verts)
//         meshVerticesQuantity.push(verts.length)
//     }
//     console.log(meshArray)
// }

// function create_triangle_outline(size, verts){
//     // console.log(verts)
//     var i = 0
//     var figure = []

//     verts.forEach(vert => {
//         figure.push(vertices[vert])
  
//         positionsArray.push(vertices[vert])
//         colorsArray.push(color)
//     });

// }


// function get_vertices_quantity(size, type){
//     var quantity = 3
//     if(type == 2){
//         for(var i = 1; i < size; i++){
//             quantity = quantity + 3 + i-1
//         }
//     }

//     return quantity
// }

// function calculate_vertices_quantity(){
//     for(var i = 0; i < num_elements; i++){
//         var size = elements[i][1]
//         var type = elements[i][0]
//         meshVerticesQuantity[i] = get_vertices_quantity(size, type)
//     }

// }

// function trianglesToWireframe(vertices)
// {
// 	//Declare a return array
//     var readyToLines = []
// 	//loop index i from [0 to vertices length), counting by 3s
//     for(var i = 0; i < vertices.length; i = i + 3)
// 	{
// 		//add vertex at index i to return array
//         readyToLines.push(vertices[i])
// 		//add two copies of vertex at index i + 1 to return array
//         readyToLines.push(vertices[i+1])
//         readyToLines.push(vertices[i+1])
// 		//add two copies of vertex at index i + 2 to return array
//         readyToLines.push(vertices[i+2])
//         readyToLines.push(vertices[i+2])
// 		//add vertex at index i to return array
//         readyToLines.push(vertices[i])
        
// 	}
// 	//return the return array
//     return readyToLines
// }
