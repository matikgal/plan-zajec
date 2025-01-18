import { useEffect, useState } from 'react'
import { database } from '../../firebaseConfig' // Ścieżka do konfiguracji Firebase
import { ref, get } from 'firebase/database'

type DataItem = {
	id: string
	dzien_tygodnia: string
	godzina_do: string
	godzina_od: string
	grupa: string
	kierunek: string
	prowadzacy: string
	przedmiot: string
	sala: string
	semestr: string
	stopien: string
	tydzien: string
	typ: string
	wydzial: string
}

export default function MainComponent() {
	const [data, setData] = useState<DataItem[]>([])
	const [filters, setFilters] = useState({
		grupa: '',
		kierunek: '',
		semestr: '',
		stopien: '',
		typ: '',
		wydzial: '',
		tydzien: '', // Przechowuje zakres tygodnia, np. "30.09-06.10"
	})
	const [daysOfWeek] = useState(['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'])

	useEffect(() => {
		const fetchData = async () => {
			const dataRef = ref(database, '/') // Ścieżka do głównego węzła bazy
			try {
				const snapshot = await get(dataRef)
				if (snapshot.exists()) {
					const dbData = snapshot.val()
					const formattedData = Object.keys(dbData).map(key => ({
						id: key,
						...dbData[key],
					}))
					setData(formattedData)
				} else {
					console.log('Brak danych w bazie')
				}
			} catch (error) {
				console.error('Błąd podczas pobierania danych:', error)
			}
		}

		fetchData()
	}, [])

	// Filtruj dane na podstawie wybranych opcji
	const filteredData = data.filter(item =>
		Object.entries(filters).every(([key, value]) => (value ? item[key as keyof DataItem] === value : true))
	)

	// Obsługa zmiany w filtrach
	const handleFilterChange = (key: string, value: string) => {
		setFilters(prev => ({
			...prev,
			[key]: value,
		}))
	}

	// Pobierz unikalne wartości dla pola
	const getUniqueValues = (key: keyof DataItem) => {
		return [...new Set(data.map(item => item[key]))]
	}

	// Funkcja, która sprawdza, czy tygodnie się pokrywają
	const isWeekInRange = (itemWeek: string, selectedWeek: string) => {
		if (!selectedWeek) return true

		const [startDate, endDate] = selectedWeek.split('-')
		const itemDates = itemWeek.split('-')

		return (
			(startDate <= itemDates[0] && endDate >= itemDates[1]) ||
			(startDate <= itemDates[1] && endDate >= itemDates[0]) ||
			(startDate >= itemDates[0] && endDate <= itemDates[1])
		)
	}

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Filtruj dane</h1>

			<div className="grid grid-cols-2 gap-4 mb-6">
				{['grupa', 'kierunek', 'semestr', 'stopien', 'typ', 'wydzial'].map(filterKey => (
					<div key={filterKey}>
						<label className="block text-lg mb-2 capitalize" htmlFor={filterKey}>
							{filterKey}:
						</label>
						<select
							id={filterKey}
							className="p-2 border rounded w-full"
							value={filters[filterKey as keyof typeof filters]}
							onChange={e => handleFilterChange(filterKey, e.target.value)}>
							<option value="">Wszystkie</option>
							{getUniqueValues(filterKey as keyof DataItem).map(value => (
								<option key={value} value={value}>
									{value}
								</option>
							))}
						</select>
					</div>
				))}

				{/* Filtr Tydzień */}
				<div>
					<label className="block text-lg mb-2 capitalize" htmlFor="tydzien">
						Tydzień:
					</label>
					<select
						id="tydzien"
						className="p-2 border rounded w-full"
						value={filters.tydzien}
						onChange={e => handleFilterChange('tydzien', e.target.value)}>
						<option value="">Wszystkie</option>
						{[...new Set(data.map(item => item.tydzien))].map(week => (
							<option key={week} value={week}>
								{week}
							</option>
						))}
					</select>
				</div>
			</div>

			<h2 className="text-xl font-bold mb-4">Plan zajęć</h2>
			<div className="flex">
				{daysOfWeek.map(day => (
					<div key={day} className="w-1/5 p-2">
						<h3 className="font-bold text-center">{day}</h3>
						<div>
							{filteredData
								.filter(item => item.dzien_tygodnia === day && isWeekInRange(item.tydzien, filters.tydzien))
								.sort((a, b) => a.godzina_od.localeCompare(b.godzina_od)) // Sortowanie według godziny od
								.map(item => (
									<div key={item.id} className="mb-4 p-2 border border-gray-300 rounded shadow-md">
										<div className="font-bold">{item.przedmiot}</div>
										<div>{item.prowadzacy}</div>
										<div>{item.sala}</div>
										<div>
											{item.godzina_od} - {item.godzina_do}
										</div>
									</div>
								))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
