import { context } from './main'

export async function draw() {
	const { offCav, offCtx, renderBuffers } = context
	offCtx.clearRect(0, 0, offCav.width, offCav.height)

	const casFont = new FontFace('cas', 'url(/CascadiaCodePL.ttf)')
	const font = await casFont.load()
	document.fonts.add(font)

	offCtx.fillStyle = 'red'
	offCtx.font = '30px cas'
	offCtx.fillText('const :: |> <| => != >= <=', 0, 30)
	renderBuffers.push(offCtx.getImageData(0, 0, offCav.width, offCav.height))

	context.renderEnabled = true
}

/**
 * 要对一张 2D 图像执行透视变换，并将变换结果投影到 2D 平面上，以下是具体的步骤：

1. 准备图像数据
	•	图像数据是一个 2D 数组，每个元素是 [r, g, b, a]。
	•	通常，这是一个 HTML5 <canvas> 的 ImageData 或其他类似的数据结构。

2. 定义透视变换矩阵

透视变换可以用 3x3 矩阵定义：

￼

对于图像中的每个点 (x, y)，其新位置 (x', y') 通过以下公式计算：

￼

3. 应用透视变换

使用逆向映射的方式（Backward Mapping），即遍历目标图像的像素 (x', y')，计算其对应原图像的坐标 (x, y)，然后插值获得颜色值。

4. 插值计算颜色值

由于 (x, y) 通常不是整数，需要对其进行双线性插值，从原图中获得颜色值。

5. 绘制变换后的图像

将计算得到的颜色值填充到新的 ImageData 中，然后绘制到 <canvas> 或其他图形工具上。

示例代码

以下是用 JavaScript 实现的流程：

function applyPerspectiveTransform(imageData, width, height, matrix) {
    const output = new Uint8ClampedArray(imageData.length);
    const [a, b, c, d, e, f, g, h] = matrix;

    function getPixel(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        if (ix < 0 || ix >= width || iy < 0 || iy >= height) return [0, 0, 0, 0];
        const idx = (iy * width + ix) * 4;
        return [
            imageData[idx],
            imageData[idx + 1],
            imageData[idx + 2],
            imageData[idx + 3]
        ];
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const wx = (g * x + h * y + 1);
            const srcX = (a * x + b * y + c) / wx;
            const srcY = (d * x + e * y + f) / wx;

            // Bilinear interpolation
            const color = getPixel(srcX, srcY);
            const idx = (y * width + x) * 4;
            output[idx] = color[0];
            output[idx + 1] = color[1];
            output[idx + 2] = color[2];
            output[idx + 3] = color[3];
        }
    }

    return output;
}

// 示例使用
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = image.width;
canvas.height = image.height;
ctx.drawImage(image, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// 透视变换矩阵
const matrix = [
    1, 0.2, 0,  // 第一行
    0.1, 1, 0,  // 第二行
    0.001, 0.001, 1  // 第三行
];

const transformedData = applyPerspectiveTransform(imageData.data, canvas.width, canvas.height, matrix);
const transformedImage = new ImageData(new Uint8ClampedArray(transformedData), canvas.width, canvas.height);
ctx.putImageData(transformedImage, 0, 0);

注意点
	1.	矩阵选择：矩阵 M 的参数会决定透视效果，例如拉伸、旋转或倾斜。
	2.	边界处理：透视变换后，可能会有像素超出原图像范围，需要适当处理（例如，设置透明像素）。
	3.	优化性能：图像较大时，计算量可能较大，可以借助 WebGL 等硬件加速。

如果使用其他语言或框架实现，可以借鉴类似的逻辑。
 */
