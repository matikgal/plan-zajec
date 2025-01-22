import { useEffect, useState } from 'react'
import { database } from '../../firebaseConfig' // Ścieżka do konfiguracji Firebase
import { ref, get } from 'firebase/database'
import { BiSolidLeftArrow, BiSolidRightArrow } from 'react-icons/bi'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import '../index.css'

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

type FilterKey = 'stopien' | 'wydzial' | 'typ' | 'kierunek' | 'semestr' | 'grupa'

export default function MainComponent() {
	const polishLabels: Record<FilterKey, string> = {
		stopien: 'Stopień',
		wydzial: 'Wydział',
		typ: 'Typ',
		kierunek: 'Kierunek',
		semestr: 'Semestr',
		grupa: 'Grupa',
	}

	const timeToSlotIndex = (time: string): number => {
		const [hour, minute] = time.split(':').map(Number)
		const totalMinutes = hour * 60 + minute
		const startTime = 8 * 60
		return Math.floor((totalMinutes - startTime) / 15)
	}

	const calculateSlots = (startTime: string, endTime: string): number => {
		const startIndex = timeToSlotIndex(startTime)
		const endIndex = timeToSlotIndex(endTime)
		return endIndex - startIndex
	}

	const [data, setData] = useState<DataItem[]>([])
	const [filters, setFilters] = useState({
		wydzial: '',
		typ: '',
		kierunek: '',
		stopien: '',
		semestr: '',
		grupa: '',
		tydzien: '', // Przechowuje zakres tygodnia, np. "30.09-06.10"
	})
	const [currentWeek, setCurrentWeek] = useState<string>('')

	useEffect(() => {
		const week = getCurrentWeekRange()
		setCurrentWeek(week)
	}, [])

	useEffect(() => {
		handleFilterChange('tydzien', currentWeek)
	}, [currentWeek])

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
	function getCurrentWeekRange(): string {
		const today = new Date()

		// Oblicz dzień tygodnia (poniedziałek = 1, niedziela = 7)
		const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()

		// Oblicz datę poniedziałku
		const monday = new Date(today)
		monday.setDate(today.getDate() - (dayOfWeek - 1))

		// Oblicz datę niedzieli
		const sunday = new Date(today)
		sunday.setDate(today.getDate() + (7 - dayOfWeek))

		// Funkcja do formatowania dat w formacie dd.mm
		const formatDate = (date: Date) =>
			`${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`

		const result = `${formatDate(monday)}-${formatDate(sunday)}`
		return result
	}

	const getWeekRange = (currentWeek: string, direction: 'next' | 'previous'): string => {
		// Rozdzielamy daty początkową i końcową
		const [startDateStr, endDateStr] = currentWeek.split('-')

		// Funkcja do konwersji daty z formatu dd.mm na yyyy-mm-dd
		const convertToDate = (dateStr: string): Date => {
			const [day, month] = dateStr.split('.').map(Number)
			const year = new Date().getFullYear() // Bierzemy aktualny rok
			return new Date(year, month - 1, day) // Tworzymy datę w formacie yyyy-mm-dd
		}

		// Przekształcamy obie daty
		const startDate = convertToDate(startDateStr)
		const endDate = convertToDate(endDateStr)

		// Dodajemy lub odejmujemy 7 dni, w zależności od kierunku
		const daysToAddOrSubtract = direction === 'next' ? 7 : -7
		startDate.setDate(startDate.getDate() + daysToAddOrSubtract)
		endDate.setDate(endDate.getDate() + daysToAddOrSubtract)

		// Funkcja do formatowania daty na dd.mm
		const formatDate = (date: Date) => {
			const day = String(date.getDate()).padStart(2, '0')
			const month = String(date.getMonth() + 1).padStart(2, '0')
			return `${day}.${month}`
		}

		// Zwracamy zakres wybranego tygodnia
		const weekRange = `${formatDate(startDate)}-${formatDate(endDate)}`
		console.log(`${direction === 'next' ? 'Następny' : 'Poprzedni'} tydzień: ${weekRange}`)
		setCurrentWeek(weekRange) // Ustawiamy stan dla odpowiedniego tygodnia

		return weekRange
	}

	console.log(`Aktualny tydzień: ${currentWeek}`)

	return (
		<div className="w-full min-h-screen flex  justify-center bg-gray-900 relative overflow-hidden p-4 ">
			<div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-30 blur-xl"></div>
			{/* Panel filtrów */}
			<div className="relative bg-white bg-opacity-10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg p-6 flex flex-col gap-8 xl:flex-row max-w-screen w-full ">
				<div className="w-full xl:w-1/3">
					<h1 className="text-2xl font-bold text-white mb-6">Filtruj dane</h1>
					<div className="grid grid-cols-2 xl:grid-cols-1 gap-6">
						{['wydzial', 'typ', 'kierunek', 'stopien', 'semestr', 'grupa'].map(filterKey => (
							<div key={filterKey}>
								{/* <label className="block text-lg text-gray-200 mb-2 capitalize" htmlFor={filterKey}>
									{filterKey}:
								</label>
								<select
									id={filterKey}
									className="p-2 rounded w-full bg-gray-800 text-gray-200 border border-gray-700 focus:ring-2 focus:ring-blue-500"
									value={filters[filterKey as keyof typeof filters]}
									onChange={e => handleFilterChange(filterKey, e.target.value)}>
									<option value="">Wszystkie</option>
									{getUniqueValues(filterKey as keyof DataItem).map(value => (
										<option key={value} value={value}>
											{value}
										</option>
									))}
								</select> */}

								{/* <label className="block text-lg text-gray-200 mb-2 capitalize" htmlFor={filterKey}>
									{filterKey}:
								</label> */}
								<Select
									id={filterKey}
									className="capitalize rounded w-full bg-gray-800 !text-gray-200 mb-5"
									value={filters[filterKey as keyof typeof filters]}
									onChange={e => handleFilterChange(filterKey, e.target.value)}
									displayEmpty>
									<MenuItem value="" className="capitalize !text-gray-800" disabled>
										{polishLabels[filterKey as FilterKey] || filterKey}
									</MenuItem>
									{getUniqueValues(filterKey as keyof DataItem).map(value => (
										<MenuItem key={value} value={value} className="text-gray-200">
											{value}
										</MenuItem>
									))}
								</Select>
							</div>
						))}
						{/* Filtr tygodnia */}
						<div>
							<label className="block text-lg text-gray-200 mb-2 capitalize" htmlFor="tydzien">
								Tydzień:
							</label>
							<Select
								id="tydzien"
								className=" rounded w-full bg-gray-800 !text-gray-200 border border-gray-700 focus:ring-2 focus:ring-blue-500"
								value={filters.tydzien}
								onChange={e => {
									handleFilterChange('tydzien', e.target.value)
									setCurrentWeek(e.target.value)
								}}>
								<MenuItem value={currentWeek}>{currentWeek}</MenuItem>
								{[...new Set(data.map(item => item.tydzien))].map(week => (
									<MenuItem key={week} value={week}>
										{week}
									</MenuItem>
								))}
							</Select>
						</div>
					</div>
				</div>
				{/* Plan zajęć */}
				<div className="w-full">
					<div className="flex items-center justify-center">
						<div className="flex items-center justify-center gap-4 mb-6">
							<a
								className="px-4 py-2 text-white hover:scale-125 duration-200 cursor-pointer"
								onClick={() => getWeekRange(currentWeek, 'previous') && handleFilterChange('tydzien', currentWeek)}>
								<BiSolidLeftArrow />
							</a>
							<h2 className="text-lg font-bold text-gray-200">{currentWeek}</h2>

							<a
								className="px-4 py-2 text-white hover:scale-125 duration-200 cursor-pointer"
								onClick={() => getWeekRange(currentWeek, 'next') && handleFilterChange('tydzien', currentWeek)}>
								<BiSolidRightArrow />
							</a>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
						{daysOfWeek.map(day => (
							<div key={day} className="p-4 bg-gray-800 rounded-lg shadow-md">
								<h3 className="font-bold text-center text-white mb-4">{day}</h3>
								<div className="relative" style={{ height: 'calc(52 * var(--slot-height))' }}>
									{/* Kratki tła */}
									{Array.from({ length: 52 }).map((_, index) => (
										<div
											key={index}
											className="absolute w-full border-b border-gray-700"
											style={{ top: `calc(${index} * var(--slot-height))`, height: 'var(--slot-height)' }}></div>
									))}

									{/* Przedmioty */}
									{filteredData
										.filter(item => item.dzien_tygodnia === day)
										.sort((a, b) => a.godzina_od.localeCompare(b.godzina_od))
										.map(item => {
											const startSlot = timeToSlotIndex(item.godzina_od)
											const slots = calculateSlots(item.godzina_od, item.godzina_do)
											const height = `calc(${slots} * var(--slot-height))` // Wysokość w jednostkach względnych

											return (
												<div
													key={item.id}
													className="absolute w-full p-2 bg-gray-900 border border-gray-700 rounded shadow"
													style={{ top: `calc(${startSlot} * var(--slot-height))`, height }}>
													<div className="flex fl">
														<div className="w-1/2">
															<div className="font-bold text-white">{item.przedmiot}</div>
															<div className="text-gray-400">{item.prowadzacy}</div>
														</div>
														<div className="w-1/2">
															<div className="text-gray-400">{item.sala}</div>
															<div className="text-gray-200">
																{item.godzina_od} - {item.godzina_do}
															</div>
														</div>
													</div>
												</div>
											)
										})}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
