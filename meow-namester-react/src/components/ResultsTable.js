import React from 'react';

const ResultsTable = ({ results, userName }) => {
    return (
        <table style={{
            width: "400px",
            fontSize: "18px",
            lineHeight: "120%",
            marginLeft: "auto",
            marginRight: "auto",
            border: "1px solid #000",
            borderCollapse: "collapse"
        }}>
            <thead>
                <tr>
                    <th style={{
                        color: "#ffffff",
                        backgroundColor: "#e097d9",
                        textAlign: "center"
                    }}>rank</th>
                    <th style={{
                        color: "#ffffff",
                        backgroundColor: "#e097d9",
                        textAlign: "center"
                    }}>options</th>
                </tr>
            </thead>
            <tbody>
                {results.map((result, index) => (
                    <tr key={index}>
                        <td style={{
                            border: "1px solid #000",
                            textAlign: "center",
                            paddingRight: "5px"
                        }}>{index + 1}</td>
                        <td style={{
                            border: "1px solid #000",
                            paddingLeft: "5px"
                        }}>{result}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ResultsTable;
