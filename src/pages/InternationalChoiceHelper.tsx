import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import Footer from '../components/utils/Footer';
import MapInternationalHelper from '../components/international/MapInternationalHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons';
import ScrollProgressBar from '../components/utils/ScrollDownProgressBar';

const ROWS_PER_PAGE = 10; // Nombre de lignes affichées par page

const InternationalChoiceHelper: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [formation, setFormation] = useState<string>('FI');
    const [category, setCategory] = useState<string>('');

    const [favorites, setFavorites] = useState<any[]>([]);

    const [columns, setColumns] = useState<string[]>([]); // Colonnes dynamiques

    // Charger les favoris depuis le localStorage
    useEffect(() => {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
    }, []);

    // Sauvegarder les favoris dans le localStorage
    const saveFavorites = (favorites: any[]) => {
        setFavorites(favorites);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    };

    // Fonction pour basculer une ligne dans les favoris
    const toggleFavorite = (row: any) => {
        const isFavorite = favorites.some(
            (fav) => JSON.stringify(fav) === JSON.stringify(row)
        );
        if (isFavorite) {
            const updatedFavorites = favorites.filter(
                (fav) => JSON.stringify(fav) !== JSON.stringify(row)
            );
            saveFavorites(updatedFavorites);
        } else {
            saveFavorites([...favorites, row]);
        }
    };

    // Colonnes pour les filtres dynamiques
    const filterableColumns = ['ZONE', 'PAYS', 'VILLE'];

    // Chemin du fichier CSV local (dans le dossier public)
    const csvFilePath = './Liste_Destinations_2025.csv'; // Placez votre fichier CSV dans public/assets/

    // Charger le fichier CSV localement avec Axios
    useEffect(() => {
        const fetchCsv = async () => {
            try {
                const response = await axios.get(csvFilePath, {
                    responseType: 'blob' // Spécifie que nous recevons un blob
                });
                const fileReader = new FileReader();
                fileReader.onload = (e) => {
                    const csvText = e.target?.result as string;
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            const jsonData = results.data;
                            if (jsonData.length > 0) {
                                setColumns(Object.keys(jsonData[0] || {}));
                                setData(jsonData);
                                setFilteredData(jsonData);
                            }
                        }
                    });
                };
                fileReader.readAsText(response.data);
            } catch (error) {
                console.error(
                    'Erreur lors du chargement du fichier CSV :',
                    error
                );
            }
        };

        fetchCsv();
    }, []);

    useEffect(() => {
        const filtered = data.filter((row) => {
            // Vérifier les filtres dynamiques
            const matchesFilters = filterableColumns.every(
                (column) =>
                    !filters[column] ||
                    row[column]
                        ?.toString()
                        .toLowerCase()
                        .includes(filters[column].toLowerCase())
            );

            // Vérifier le filtre Formation
            const matchesFormation =
                !formation ||
                (row[formation] && row[formation].toString().trim() !== '');

            // Vérifier le filtre Category
            const matchesCategory = (() => {
                if (!category) return true; // Si aucune catégorie n'est sélectionnée
                const value = row['Category (indicative) C1/C2/C3']
                    ?.toString()
                    .toUpperCase();
                if (!value) return false;

                switch (category) {
                    case 'C1':
                        return (
                            value.startsWith('C1') ||
                            value.startsWith('C2') ||
                            value.startsWith('C3')
                        );
                    case 'C2':
                        return value.startsWith('C2') || value.startsWith('C3');
                    case 'C3':
                        return value.startsWith('C3');
                    default:
                        return false;
                }
            })();

            return matchesFilters && matchesFormation && matchesCategory;
        });

        console.log('filtered', filtered);

        setFilteredData(filtered);
    }, [filters, formation, category, data]);

    // Mettre à jour les filtres
    const handleFilterChange = (column: string, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [column]: value
        }));
        setCurrentPage(1); // Réinitialiser à la première page après un filtrage
    };

    // Pagination : Obtenir les données pour la page actuelle
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

    return (
        <div className="container mx-auto p-4">
            <ScrollProgressBar />
            <div className="flex mb-6 flex-col md:flex-row items-center justify-between">
                <h1 className="text-2xl font-bold mb-4 dark:text-gray-200">
                    International Choice Helper 🌍💫
                    {/* by Berachem */}
                    <span className="text-sm block font-normal dark:text-gray-400">
                        Aide à la recherche de destination internationale pour
                        les étudiants de l'ESIEE Paris
                    </span>
                </h1>
                {/* Bouton pour soutenir */}
                <a
                    href="https://buy.stripe.com/00g6pobii8figJG6os"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-wrap items-center justify-center gap-2 p-2 bg-purple-500 text-white rounded dark:bg-purple-400 animate-pulse"
                >
                    <span>Soutenir</span>
                    <img
                        src="https://www.afscm.org/wp-content/uploads/2019/08/quel-terminal-de-paiement-pour-stripe.png"
                        alt="Buy Me A Coffee"
                        className="h-8"
                    />
                    <FontAwesomeIcon icon={faArrowAltCircleRight} />
                </a>
            </div>

            {/* Affichage des favoris */}
            {favorites.length > 0 && (
                <div className="mb-6 p-4 border rounded bg-gray-100 dark:bg-gray-800">
                    <h2 className="text-lg font-bold dark:text-gray-200">
                        Vos Favoris :
                    </h2>
                    <ul className="list-disc pl-6 dark:text-gray-300">
                        {favorites.map((fav, index) => (
                            <li key={index}>
                                {fav['UNIVERSITE PARTENAIRE OFFRE DE SÉJOUR'] ||
                                    'Université inconnue'}{' '}
                                , {fav['VILLE'] || 'Ville inconnue'} (
                                {fav['PAYS'] || 'Pays inconnu'}) -{' '}
                                {fav['Category (indicative) C1/C2/C3'] ||
                                    'Catégorie inconnue'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.length === 0 ? (
                <p className="dark:text-gray-400">
                    Chargement des données depuis {csvFilePath}...
                </p>
            ) : (
                <>
                    {/* Filtres dynamiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {filterableColumns.map((column) => (
                            <div key={column}>
                                <label className="block font-bold mb-1 dark:text-gray-300">
                                    {column}
                                </label>
                                <input
                                    type="text"
                                    placeholder={`Filtrer par ${column}`}
                                    value={filters[column] || ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            column,
                                            e.target.value
                                        )
                                    }
                                    className="p-2 border rounded w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                />
                            </div>
                        ))}

                        {/* Filtre Formation */}
                        <div>
                            <label className="block font-bold mb-1 dark:text-gray-300">
                                Formation
                            </label>
                            <select
                                value={formation}
                                onChange={(e) => setFormation(e.target.value)}
                                className="p-2 border rounded w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="">Toutes</option>
                                {[
                                    'AIC',
                                    'BIO',
                                    'CYB',
                                    'DSIA',
                                    'ENE',
                                    'GI',
                                    'INF',
                                    'SE',
                                    'SEI',
                                    'FE',
                                    'FG',
                                    'FI',
                                    'FR',
                                    'FT'
                                ].map((formationOption) => (
                                    <option
                                        key={formationOption}
                                        value={formationOption}
                                    >
                                        {formationOption}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre Category */}
                        <div>
                            <label className="block font-bold mb-1 dark:text-gray-300">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="p-2 border rounded w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            >
                                <option value="">Toutes</option>
                                {['C1', 'C2', 'C3'].map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sentence to resume what is he looking for */}
                    {category && formation && (
                        <div className="mb-6 dark:text-gray-300">
                            You are looking for a{' '}
                            <span className="font-bold">{category}</span>{' '}
                            internship in{' '}
                            <span className="font-bold">{formation}</span>{' '}
                            formation.
                        </div>
                    )}

                    {/* Tableau des données */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-900 border rounded shadow">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="py-2 px-4 border dark:border-gray-700 dark:text-gray-300">
                                        Favoris
                                    </th>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="py-2 px-4 border dark:border-gray-700 dark:text-gray-300"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row, rowIndex) => (
                                        <tr
                                            key={rowIndex}
                                            className="even:bg-gray-100 odd:bg-gray-50 dark:even:bg-gray-800 dark:odd:bg-gray-700"
                                        >
                                            <td className="py-2 px-4 border dark:border-gray-700 dark:text-gray-200 text-center">
                                                <button
                                                    onClick={() =>
                                                        toggleFavorite(row)
                                                    }
                                                    className={`text-lg ${
                                                        favorites.some(
                                                            (fav) =>
                                                                JSON.stringify(
                                                                    fav
                                                                ) ===
                                                                JSON.stringify(
                                                                    row
                                                                )
                                                        )
                                                            ? 'text-yellow-500'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    ★
                                                </button>
                                            </td>
                                            {columns.map((column) => (
                                                <td
                                                    key={column}
                                                    className="py-2 px-4 border dark:border-gray-700 dark:text-gray-200"
                                                >
                                                    <div
                                                        className="truncate"
                                                        title={
                                                            row[column] || ''
                                                        }
                                                    >
                                                        {row[column]
                                                            ?.toString()
                                                            .startsWith(
                                                                'http'
                                                            ) ? (
                                                            <a
                                                                href={
                                                                    row[column]
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 underline"
                                                            >
                                                                {row[column]}
                                                            </a>
                                                        ) : (
                                                            row[column] || ''
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="text-center py-4 dark:text-gray-400"
                                        >
                                            Aucun résultat trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-4 space-x-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="p-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="dark:text-gray-300">
                                Page {currentPage} sur {totalPages} -- (
                                {filteredData.length} résultats)
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="p-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            )}

            <MapInternationalHelper data={filteredData} />

            {/* Bouton pour soutenir */}
            <a
                href="https://buy.stripe.com/00g6pobii8figJG6os"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-wrap items-center justify-center gap-2 p-2 bg-purple-500 text-white rounded dark:bg-purple-400 animate-pulse"
            >
                <span>Soutenir</span>
                <img
                    src="https://www.afscm.org/wp-content/uploads/2019/08/quel-terminal-de-paiement-pour-stripe.png"
                    alt="Buy Me A Coffee"
                    className="h-8"
                />
                <FontAwesomeIcon icon={faArrowAltCircleRight} />
            </a>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default InternationalChoiceHelper;
