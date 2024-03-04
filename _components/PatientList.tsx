"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Patient {
  _id: string;
  name: string;
  first_name: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
}

const PAGE_SIZE = 20; 

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:4000/api/home?page=${page}&pageSize=${PAGE_SIZE}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: Patient[] = await response.json();
        setPatients(prevPatients => [...prevPatients, ...data]);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  if (isLoading && patients.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='shadow-md rounded-lg bg-white p-10'>
      <h2 className='text-xl font-semibold mb-4 text-gray-700'>My Patients</h2>
      <div>
        {patients.map(patient => (
          <div className='mt-2 bg-white hover:cursor-pointer hover:bg-gray-500 p-4' key={patient._id}>
          <Link href={`/patient?id=${patient._id}`}>
            <div className='text-gray-800'>
              <span className='font-bold'>{patient.name}</span>, {patient.first_name} - 
              <span className='font-bold'> Age:</span> {patient.age}, 
              <span className='font-bold'> Height:</span> {patient.height}cm, 
              <span className='font-bold'> Weight:</span> {patient.weight}kg, 
              <span className='font-bold'> Gender:</span> {patient.gender}
            </div>
          </Link>
        </div>
        
        ))}
      </div>
      <button onClick={handleLoadMore} disabled={isLoading}>Load More</button>
    </div>
  );
};

export default PatientList;
