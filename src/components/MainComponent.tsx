export default function MainComponent() {
	return (
		<div>
			<div>
				<select
					id="kierunek"
					className="block w-64 m-2 border-2 px-4 py-2 text-base rounded-full text-gray-700 bg-white  border-[#5abe2c]  shadow-sm focus:ring-[#3d3d3d] focus:border-[#3d3d3d]">
					<option value="" disabled selected>
						Wybierz kierunek
					</option>
					<option value="A">A</option>
					<option value="B">B</option>
					<option value="C">C</option>
					<option value="D">D</option>
				</select>
			</div>
		</div>
	)
}
