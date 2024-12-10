let stream

self.onmessage = async (e) => {
	const data = e.data

	if (data.type === 1) {
		const handle = data.payload
		stream = await handle.createWritable()
		console.log(stream)
	}
	if (data.type === 2) {
		await stream.close()
	}
	if (!data.type) {
		// 只取透明度信息
		const chunk = new Uint8Array(data).filter((_, i) => i % 4 === 3)
		const continuousBits = new Uint16Array(chunk.length)

		let preV = chunk[0]
		let idx = 0

		chunk.forEach((v) => {
			if (v !== preV) {
				idx++
			}
			continuousBits[idx]++
			preV = v
		})

		const res = continuousBits.filter((v) => v)
		stream.write(res)
	}
}
