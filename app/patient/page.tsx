"use client"
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'

import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface Medication {
  _id: string;
  name: string;
  dosage: string;
  start_date: string | null;
  end_date: string | null;
  last_administered: string | null;
}

interface BodyTemperature {
  _id: string;
  date: string;
  temperature: number;
}

interface Patient {
  _id: string;
  name: string;
  first_name: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  medications: Medication[];
  body_temperatures: BodyTemperature[];
}

const PatientPage: React.FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [showTempModal, setShowTempModal] = useState<boolean>(false)
  const [showAdministerModal, setShowAdministerModal] = useState<boolean>(false) 
  const [medForm, setMedForm] = useState({ name: '', dosage: '', _id: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [temperatureInput, setTemperature] = useState<string>('');
  const [tempTaken, setTempTaken] = useState(false)
  const [medsAdministered, setMedsAdministered] = useState<Number[]>([])

  // useEffect(() => {
  //   console.log(patient)
  // }, [patient])

  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/patient?id=${patientId}`);
        const data: Patient = await response.json();
        setPatient(data);
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, []);


  // chart filtering functionality
  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value);
  };

  const filteredTemperatures = patient?.body_temperatures.filter(temp => {
    const tempDate = new Date(temp.date);
    const now = new Date();
    const monthsAgo = (months: number) => new Date(now.setMonth(now.getMonth() - months));
    
    // check for recent temperature record (24 hours)
    if (!tempTaken) {
      const timeDifferenceInMs = now.getTime() - tempDate.getTime();
      const timeDifferenceInHours = timeDifferenceInMs / (1000 * 60 * 60); // Convert milliseconds to hours
      if (timeDifferenceInHours <= 24) {
        setTempTaken(true)
      }
    }

    switch (timeRange) {
      case '1':
        return tempDate > monthsAgo(1);
      case '3':
        return tempDate > monthsAgo(3);
      case '6':
        return tempDate > monthsAgo(6);
      case 'all':
      default:
        return true;
    }
  });

  const sortedTemperatures = filteredTemperatures
  ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chartData = {
    labels: sortedTemperatures?.map(temp => temp.date.substring(0, 10)),
    datasets: [
      {
        label: 'Body Temperature (°C)',
        data: sortedTemperatures?.map(temp => temp.temperature), 
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };


  // add/modify medication functionality 
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setMedForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdministerMeds = async () => {
    if (medsAdministered.length) {
      // update db
      const tempPatient = patient
      // updates date last administered to now
      tempPatient?.medications.forEach((med, index) => {
        if (medsAdministered.includes(index)) {
          tempPatient.medications[index].end_date = new Date().toDateString()
        }
      })
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "medications": tempPatient?.medications
        }) 
      };
      try {
        const response = await fetch('http://localhost:4000/api/patient/update?id=' + patientId, requestOptions)
        const data: Patient = await response.json();
        // update state
        setPatient(data)
      } catch (error) {
        console.log(error)
      }
      // update state
    }
  }

  // const handleAddMed = (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   if (isEditing) {
  //     // Logic to update an existing medication
  //     const updatedMeds = patient?.medications.map(med => med._id === medForm._id ? medForm : med);
  //     // Assuming `setPatient` updates the patient state including medications
      
  //     // update in db

  //     // update in state
  //     setPatient(prev => ({ ...prev, medications: updatedMeds }));
  //   } else {
  //     // Logic to add a new medication
  //     const newMed = { ...medForm, _id: Date.now().toString() }; // Simplified unique ID generation
  //     // update in db

  //     // update in state
  //     setPatient(prev => ({ ...prev, medications: [...prev.medications, newMed] }));
  //   }
  //   setMedForm({ name: '', dosage: '', _id: '' }); // Reset form
  //   setIsEditing(false); // Exit editing mode
  // };

  // const editMedication = (medication) => {
  //   setMedForm(medication);
  //   setIsEditing(true);
  // };

  // record temperature functionality
  const handleTempInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(event.target.value);
  };
  const handleAddTemp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temperature: temperatureInput,
        patientId: patientId
      }) 
    };
    try {
      console.log(requestOptions)
      // update in db
      const response = await fetch(`http://localhost:4000/api/patient/recordtemperature`, requestOptions)
      // update in state
      const data: Patient = await response.json();
      setPatient(data)
      setShowTempModal(false)
    }
    catch (error){
      console.error("Failed to upload temperature data:", error);
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (!patient) return <div>No patient data found</div>;

  
  return (
    <>
    {/* Record Temperature Modal */}
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${showTempModal ? "" : "hidden"}`}>
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="relative h-[300px] w-[500px] p-4 bg-white shadow-md rounded-lg text-center z-200 flex flex-col items-center py-4">
        <button 
          className="absolute top-0 left-0 mt-2 ml-2 text-lg text-black"
          onClick={() => {
            setShowTempModal(false)
          }}
        >
          x
        </button>
        <p className='text-lg font-semibold mb-4 text-gray-700'>Record temperature reading</p>
        <form onSubmit={handleAddTemp}>
        <input 
              className='bg-white focus:outline-blue-700 text-black'
              type="text"
              name="name"
              value={temperatureInput}
              onChange={handleTempInputChange}
              placeholder="Temperature (C)"
              required
            />
          <button className=" bg-blue-500 px-4 py-2 rounded-2xl hover:bg-blue-700 transition-colors duration-300 ease-in-out" type="submit">Submit</button>
        </form>
      </div>
    </div>

    {/* Administer Medication(s) Modal */}
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${showAdministerModal ? "" : "hidden"}`}>
  <div className="fixed inset-0 bg-black opacity-50"></div>
  <div className="relative h-[300px] w-[500px] p-4 bg-white shadow-md rounded-lg text-center z-200 flex flex-col items-center py-4">
    <button 
      className="absolute top-0 left-0 mt-2 ml-2 text-lg text-black"
      onClick={() => {
        setShowAdministerModal(false)
      }}
    >
      x
    </button>
    <p className='text-lg font-semibold mb-4 text-gray-700'>Administer medication</p>
    <div>
      {patient.medications.map((med, index) => (
        <div key={index} className="flex flex-row justify-between items-center mb-2">
          <div className="text-gray-800">
            {med.name} - {med.dosage}
          </div>
          <div>
            <input 
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600"
              onChange={() => {
                if (!medsAdministered.includes(index)) {
                    setMedsAdministered(medsAdministered.concat(index));
                } else { 
                    setMedsAdministered(medsAdministered.filter(item => item !== index));
                }
              }}
              checked={medsAdministered.includes(index)}
            />
          </div>
        </div>
      ))}
    </div>
    <button 
      className="mt-4 bg-blue-500 px-4 py-2 rounded-2xl hover:bg-blue-700 transition-colors duration-300 ease-in-out"
      onClick={handleAdministerMeds}
    >
      Save
    </button>
  </div>
</div>

    {/* Main Page */}
    <div className="w-full flex flex-col p-5 space-y-7 bg-gray-100">
      <section className= "mt-5 bg-white max-w-[100%] shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Patient Credentials</h2>
        <p className="font-bold text-black">{patient.name}, {patient.first_name}</p>
        <p className="text-gray-700">Age: <span className="text-gray-900 font-medium">{patient.age}</span></p>
        <p className="text-gray-700">Height: <span className="text-gray-900 font-medium">{patient.height} cm</span></p>
        <p className="text-gray-700">Weight: <span className="text-gray-900 font-medium">{patient.weight} kg</span></p>
        <p className="text-gray-700">Gender: <span className="text-gray-900 font-medium">{patient.gender}</span></p>
      </section>

      <section className='w-full flex flex-row justify-between'>
        <div className="bg-white w-[49%] shadow-md rounded-lg p-6">
          <h2 className='text-xl font-semibold mb-4 text-gray-700'>Action Suggestions</h2> 
          <div className='w-[70%] flex flex-row justify-between'>
          <div 
            onClick={() => { tempTaken ? null : setShowTempModal(true) }}
            className={`w-40 h-40 text-white font-bold py-6 px-4 rounded-lg flex items-center justify-center text-center m-2 ${tempTaken ? 'bg-green-500' : 'cursor-pointer bg-blue-500 hover:bg-blue-700 transition-colors duration-300 ease-in-out'}`}>
            <p>{tempTaken ? 'Daily recording complete' : 'Record patient temperature'}</p>
          </div>
          <div 
            onClick={() => { setShowAdministerModal(true) }}
            className={`w-40 h-40 text-white font-bold py-6 px-4 rounded-lg flex items-center justify-center text-center m-2 cursor-pointer bg-blue-500 hover:bg-blue-700 transition-colors duration-300 ease-in-out`}>
            <p>Administer medication</p>
          </div>
          </div>
        </div>

        <div className='w-[49%] bg-white shadow-md rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4 text-gray-700'>Temperature History</h2>
          {patient.body_temperatures.length > 0 ? (
            <Line data={chartData} />
          ) : (
            <p>No temperature data available.</p>
          )}
           <select className='bg-white text-black outline-none' value={timeRange} onChange={(e) => { handleTimeRangeChange(e) } }>
              <option value="1">Last 1 Month</option>
              <option value="3">Last 3 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="all">All Time</option>
          </select>
        </div>
      </section>

      <section>
      <div className='bg-white shadow-md rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4 text-gray-700'>Medications</h2>
          <ul>
            {patient.medications.map(med => (
              <li className='text-gray-900' key={med._id}>
                {med.name} - {med.dosage} - {'PRESCRIBED FOR: '} {med.start_date?.slice(0,10)} - {med.end_date?.slice(0,10)} {med.last_administered && '- ' + 'Last Administered' + med.last_administered?.slice(0, 10) }
                {/* <button onClick={() => editMedication(med)}>Edit</button> */}
              </li>
            ))}
          </ul>
          {/* <form onSubmit={handleAddMed}> */}
            <input 
              className='bg-white text-black'
              type="text"
              name="name"
              value={medForm.name}
              onChange={handleInputChange}
              placeholder="Medication Name"
              required
            />
            <input
              className='bg-white text-black'
              type="text"
              name="dosage"
              value={medForm.dosage}
              onChange={handleInputChange}
              placeholder="Dosage"
              required
            />
            <button type="submit">{isEditing ? 'Update' : 'Add'}</button>
            {isEditing && <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>}
          {/* </form> */}
        </div>
      </section>
    </div>
    </>
  );
};

const PatientSuspense: React.FC = () => {
  return(
    <Suspense fallback={<div>Loading...</div>}>
      <PatientPage />
    </Suspense>
  )
}

export default PatientSuspense;
