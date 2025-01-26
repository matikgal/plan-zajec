import { useEffect, useState } from 'react'
import { database } from '../../firebaseConfig' // Ścieżka do konfiguracji Firebase
import { ref, get } from 'firebase/database'
import { BiSolidLeftArrow, BiSolidRightArrow } from 'react-icons/bi'
import Cookies from 'cookies-ts'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { FaBookmark } from 'react-icons/fa6'
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

const cookies = new Cookies()
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
	const [filters, setFilters] = useState<Record<string, string | null>>({
		wydzial: '',
		typ: '',
		kierunek: '',
		stopien: '',
		semestr: '',
		grupa: '',
		tydzien: '',
	})
	const [currentWeek, setCurrentWeek] = useState<string>('')

	const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek']

	//Kolor do przycisku ulubionych
	const [favColor, setFavColor] = useState('white')

	// Pobierz dane z Firebase
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

	const [tableData, setTableData] = useState<DataItem[]>([])

	const handleSearch = () => {
		const filtered = data.filter(item =>
			Object.entries(filters).every(([key, value]) => (value ? item[key as keyof DataItem] === value : true))
		)
		setTableData(filtered)
	}

	// Odczytaj filtry z ciasteczek po załadowaniu komponentu
	useEffect(() => {
		setFavColor('violet')
		const savedFilters = {
			grupa: cookies.get('filter_grupa') || '',
			kierunek: cookies.get('filter_kierunek') || '',
			semestr: cookies.get('filter_semestr') || '',
			stopien: cookies.get('filter_stopien') || '',
			typ: cookies.get('filter_typ') || '',
			wydzial: cookies.get('filter_wydzial') || '',
			tydzien: cookies.get('filter_tydzien') || '',
		}
		setFilters(savedFilters)
	}, [])
	// Ustaw początkowy tydzień po załadowaniu komponentu
	useEffect(() => {
		const week = getCurrentWeekRange()
		setCurrentWeek(week)
		setFilters(prevFilters => ({ ...prevFilters, tydzien: week }))
	}, [])

	// Zapisz każdy filtr do osobnego ciasteczka przy każdej zmianie
	useEffect(() => {
		if (cookies.get('favourite') === 'false') {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== null && value !== '') {
					cookies.set(`filter_${key}`, value, { expires: 365 })
				}
			})
		}
	}, [filters])

	// Obsługa zmiany filtrów
	const handleFilterChange = (key: string, value: string | null) => {
		setFilters(prevFilters => ({ ...prevFilters, [key]: value }))
	}

	// Filtruj dane na podstawie wybranych opcji
	// const filteredData = data.filter(item =>
	// 	Object.entries(filters).every(([key, value]) => (value ? item[key as keyof DataItem] === value : true))
	// )

	// Pobierz unikalne wartości dla danego pola
	const getUniqueValues = (key: keyof DataItem) => {
		return [...new Set(data.map(item => item[key]))]
	}
	//Funkcja do zapisywania ulubionych
	const saveFavourite = () => {
		if (cookies.get('favourite') === 'false') {
			console.log('Zapisano ulubione')
			setFavColor('violet')
			cookies.set('favourite', true, { expires: 365 })
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== null && value !== '') {
					cookies.set(`filter_${key}`, value, { expires: 365 }) // Ciasteczko wygasa po 365 dniach
				}
			})
		} else {
			cookies.set('favourite', false, { expires: 365 })
			setFavColor('white')
		}
	}
	// Funkcja do obliczania bieżącego tygodnia
	const getCurrentWeekRange = (): string => {
		const today = new Date()
		const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Poniedziałek = 1, Niedziela = 7
		const monday = new Date(today)
		monday.setDate(today.getDate() - (dayOfWeek - 1))
		const sunday = new Date(today)
		sunday.setDate(today.getDate() + (7 - dayOfWeek))

		const formatDate = (date: Date) =>
			`${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`

		return `${formatDate(monday)}-${formatDate(sunday)}`
	}

	// Funkcja do nawigacji między tygodniami
	const handleWeekChange = (direction: 'next' | 'previous') => {
		const [startDateStr, endDateStr] = currentWeek.split('-')

		const convertToDate = (dateStr: string): Date => {
			const [day, month] = dateStr.split('.').map(Number)
			const year = new Date().getFullYear()
			return new Date(year, month - 1, day)
		}

		const startDate = convertToDate(startDateStr)
		const endDate = convertToDate(endDateStr)

		const daysToAddOrSubtract = direction === 'next' ? 7 : -7
		startDate.setDate(startDate.getDate() + daysToAddOrSubtract)
		endDate.setDate(endDate.getDate() + daysToAddOrSubtract)

		const formatDate = (date: Date) => {
			const day = String(date.getDate()).padStart(2, '0')
			const month = String(date.getMonth() + 1).padStart(2, '0')
			return `${day}.${month}`
		}

		const newWeekRange = `${formatDate(startDate)}-${formatDate(endDate)}`
		setCurrentWeek(newWeekRange)
		setFilters(prevFilters => ({ ...prevFilters, tydzien: newWeekRange }))
	}

	return (
		<div className="w-full min-h-screen flex  justify-center bg-gray-900 relative overflow-hidden p-4 ">
			<div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-30 blur-xl"></div>
			<div className="relative bg-white bg-opacity-10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg p-6 flex flex-col gap-8 xl:flex-row max-w-screen w-full">
				{/* Panel filtrów */}
				<div className="w-full xl:w-1/3">
					<h1 className="text-2xl font-bold text-white mb-6">Filtruj dane</h1>
					<div className="grid grid-cols-2 xl:grid-cols-1 gap-6">
						{['wydzial', 'typ', 'kierunek', 'stopien', 'semestr', 'grupa'].map(filterKey => (
							<div key={filterKey}>
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
						<div>
							<label className="block text-lg text-gray-200 mb-2 capitalize" htmlFor="tydzien">
								Tydzień:
							</label>
							<Select
								id="tydzien"
								className=" rounded w-full bg-gray-800 !text-gray-200 border border-gray-700 focus:ring-2 focus:ring-blue-500"
								value={filters.tydzien}
								onChange={e => {
									setCurrentWeek(e.target.value || '')
									handleFilterChange('tydzien', e.target.value || '')
								}}>
								<MenuItem value={currentWeek}>{currentWeek}</MenuItem>
								{[...new Set(data.map(item => item.tydzien))].map(week => (
									<MenuItem key={week} value={week}>
										{week}
									</MenuItem>
								))}
							</Select>
						</div>
						<button
							onClick={handleSearch}
							className="  px-4 py-2 rounded-lg bg-[#EE82EE] hover:bg-[#e964e9] transition-all duration-200 mx-5 mt-2 font-bold uppercase tracking-widest text-gray-800">
							Szukaj
						</button>
					</div>
				</div>
				{/* Plan zajęć */}
				<div className="w-full">
					<div className="flex items-center justify-center relative">
						<div className="">
							<FaBookmark
								color={favColor}
								onClick={saveFavourite}
								className="scale-[2] duration-200 active:scale-100 cursor-pointer absolute left-10 top-3"
							/>
						</div>
						<div className="flex items-center justify-center gap-4 mb-6">
							<button
								className="px-4 py-2 text-white hover:scale-125 duration-200 cursor-pointer"
								onClick={() => handleWeekChange('previous')}>
								<BiSolidLeftArrow />
							</button>
							<h2 className="text-lg font-bold text-gray-200">{currentWeek}</h2>
							<button
								className="px-4 py-2 text-white hover:scale-125 duration-200 cursor-pointer"
								onClick={() => handleWeekChange('next')}>
								<BiSolidRightArrow />
							</button>
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
									{tableData
										.filter(item => item.dzien_tygodnia === day)
										.sort((a, b) => a.godzina_od.localeCompare(b.godzina_od))
										.map(item => {
											const startSlot = timeToSlotIndex(item.godzina_od)
											const slots = calculateSlots(item.godzina_od, item.godzina_do)
											const height = `calc(${slots} * var(--slot-height))`

											return (
												<div
													key={item.id}
													className="absolute w-full p-2 bg-gray-900 border border-gray-700 rounded shadow"
													style={{ top: `calc(${startSlot} * var(--slot-height))`, height }}>
													<div className="flex">
														<div className="flex flex-row justify-around  w-full items-center">
															<div className="font-bold text-white">{item.przedmiot}</div>
															<div className="text-gray-200 text-sm ">
																{item.godzina_od} - {item.godzina_do}
															</div>
														</div>
														{/* <div className="w-1/2 flex flex-col items-center ">
															<div className="text-gray-400">{item.prowadzacy}</div>
															<div className="text-gray-400">{item.sala}</div>
														</div> */}
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
